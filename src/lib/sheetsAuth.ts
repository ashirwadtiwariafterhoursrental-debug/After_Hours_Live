import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App if not already done
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");

let cachedAccessToken: string | null = null;

export async function googleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token.");
    }
    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (err) {
    console.error("Firebase/Google Sign-in error:", err);
    throw err;
  }
}

export function getCachedToken() {
  return cachedAccessToken;
}

export function clearCachedToken() {
  cachedAccessToken = null;
}

interface BookingRowData {
  fullName: string;
  email: string;
  officialEmail: string;
  whatsappNumber: string;
  locationLink: string;
  bookingItems: string;
  duration: string;
  finalPrice: string;
  discount: string;
}

export async function writeToGoogleSheets(accessToken: string, booking: BookingRowData): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  let spreadsheetId = localStorage.getItem("afterhours_sheets_id");
  let spreadsheetUrl = localStorage.getItem("afterhours_sheets_url");

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // If we don't have a spreadsheet, create one!
  if (!spreadsheetId) {
    console.log("Creating brand new Google Sheets spreadsheet...");
    const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers,
      body: JSON.stringify({
        properties: {
          title: "After Hours Rental Bookings",
        },
      }),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      console.error("Sheets creation failed:", errText);
      throw new Error(`Failed to create Google Spreadsheet: ${createResponse.statusText}`);
    }

    const createdSheet = await createResponse.json();
    spreadsheetId = createdSheet.spreadsheetId;
    spreadsheetUrl = createdSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    if (spreadsheetId) {
      localStorage.setItem("afterhours_sheets_id", spreadsheetId);
    }
    if (spreadsheetUrl) {
      localStorage.setItem("afterhours_sheets_url", spreadsheetUrl);
    }

    // Now write the headers as the first row since it's a brand new sheet
    const headerValues = [
      "Timestamp",
      "Full Name",
      "Email Address",
      "Official Email Address",
      "WhatsApp Number",
      "Location Map Link",
      "Rented Gear Items",
      "Rental Duration Period",
      "Final Securing Cost (INR)",
      "Given Discount (INR)",
    ];

    console.log("Adding Headers to Google Sheets...");
    const headerRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:J1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          values: [headerValues],
        }),
      }
    );

    if (!headerRes.ok) {
      const errText = await headerRes.text();
      console.error("Writing headers failed:", errText);
    }
  }

  // Append row
  const timestamp = new Date().toLocaleString();
  const rowData = [
    timestamp,
    booking.fullName,
    booking.email,
    booking.officialEmail || "N/A (Personal)",
    booking.whatsappNumber,
    booking.locationLink,
    booking.bookingItems,
    booking.duration,
    booking.finalPrice,
    booking.discount,
  ];

  console.log("Appending Booking row to Spreadsheet ID:", spreadsheetId);
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:J:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );

  if (!appendRes.ok) {
    const errText = await appendRes.text();
    console.error("Appending row failed, spreadsheet might have been deleted, trying once to recreate:", errText);
    // Suppress and try removing cached ID, then recreate on next attempt
    localStorage.removeItem("afterhours_sheets_id");
    localStorage.removeItem("afterhours_sheets_url");
    // Retry once
    return writeToGoogleSheets(accessToken, booking);
  }

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl: spreadsheetUrl!,
  };
}
