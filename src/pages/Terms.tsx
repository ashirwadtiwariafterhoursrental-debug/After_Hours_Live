import { motion } from "motion/react";
import { FileText, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function Terms() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-[#003791] transition-colors mb-8"
        >
          <ArrowLeft size={14} className="text-[#003791]" />
          Back to Home
        </Link>

        {/* Title Block */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#003791]/10 border border-[#003791]/25 p-2 rounded-xl text-[#003791]">
              <FileText size={20} />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#003791] font-bold">
              Legal Agreement
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase italic text-slate-800 tracking-tight font-display">
            Terms and Conditions
          </h1>
          <p className="mt-2 text-xs font-mono uppercase tracking-wider text-slate-500">
            Last updated: May 2026 • Please read carefully before renting
          </p>
        </div>

        {/* Legal Text Content */}
        <div className="space-y-8 text-slate-600 leading-relaxed font-sans text-sm">
          <section id="section-1" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">01.</span>
              Rental Contract
            </h2>
            <p className="text-slate-600">
              By renting a product, the customer enters into a legally binding rental contract with After Hours Rental. Upon successful payment of the rental fee and completion of the verification process, After Hours Rental transfers the temporary usage rights of the product to the customer. Under no circumstances does this contract signify, imply, or transfer permanent ownership of the goods to you. All products (including consoles, controllers, projectors, and cables) remain the exclusive property of After Hours Rental and must be returned in the exact original condition and working order in which they were delivered, immediately upon completion of the rental duration agreed upon in your order.
            </p>
          </section>

          <section id="section-2" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">02.</span>
              Tenure of Contract
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                The tenure of the contract is strictly equivalent to the rental duration chosen by the customer and confirmed at the time of booking. The return date and precise drop-off/pick-up times are fixed and imprinted on your booking confirmation and invoice. The product(s) must be returned in "as-is" condition by this exact deadline.
              </p>
              <div className="border-l-2 border-[#003791]/20 pl-4 space-y-2">
                <p className="text-slate-600">
                  <strong>Early Returns:</strong> In the event that you choose to return the product earlier than the end of your agreed tenure, there will be absolutely no refund, partial or full, of the rental amount collected from you.
                </p>
                <p className="text-slate-600">
                  <strong>Extensions:</strong> If you wish to extend the rental tenure, the request must be made prior to your original return deadline. Extensions are strictly subject to inventory availability and will be granted solely at the discretion of After Hours Rental.
                </p>
              </div>
              <p className="inline-flex gap-2 items-center text-xs font-mono bg-amber-50 border border-amber-200 text-amber-600 p-3 rounded-xl mt-2 w-full">
                <span>⚠️</span>
                <span>
                  <strong>Important:</strong> The maximum standard rental tenure for any equipment is 30 days. Any unauthorized attempt to hold the equipment beyond the confirmed dates without explicit written extension approval will be treated as a serious violation of this contract. This will result in immediate penalty charges and may lead to legal recovery actions.
                </span>
              </p>
            </div>
          </section>

          <section id="section-3" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">03.</span>
              Payment Policy
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                The total payment of each order includes the base rental amount, a fully refundable security deposit (if applicable under our standard non-corporate KYC process), and delivery/pick-up charges if any.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>
                  <strong>Booking Advance:</strong> A non-refundable booking advance of ₹500 is required to block the inventory and secure your dates. This amount is deducted from your final total.
                </li>
                <li>
                  <strong>Balance Payment:</strong> The remaining balance must be paid prior to or immediately upon delivery via UPI or a provided payment link.
                </li>
                <li>
                  <strong>Security Deposit:</strong> For non-corporate bookings, the security deposit must be paid in full prior to the handover of the equipment.
                </li>
              </ul>
            </div>
          </section>

          <section id="section-4" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">04.</span>
              Delivery Policy
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                Your order will be delivered to your selected address within the Delhi NCR region exclusively. Delivery timelines will be coordinated with you upon booking confirmation.
              </p>
              <p className="text-slate-600">
                <strong>Inspection:</strong> After Hours Rental conducts a thorough quality check before dispatch. Upon delivery, the equipment will be tested in front of you. The customer is expected to verify the working condition, check for any physical damage, and ensure no items are missing.
              </p>
              <p className="text-slate-600">
                <strong>Final Acceptance:</strong> Once the delivery and testing are complete, the customer assumes full responsibility for the equipment. No refund requests based on equipment performance or condition will be entertained after this handover.
              </p>
              <p className="text-slate-600">
                <strong>Operations:</strong> Our delivery personnel will drop off and test the equipment but are not responsible for custom home theater installations unless explicitly agreed upon in writing prior to delivery.
              </p>
            </div>
          </section>

          <section id="section-5" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">05.</span>
              Return & Pickup Policy
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                All rented products must be returned to After Hours Rental immediately at the end of your scheduled rental tenure.
              </p>
              <p className="text-slate-600">
                <strong>Pickup Details:</strong> Pickup will be scheduled from the exact same address provided at the time of delivery. The pickup time will be pre-coordinated based on your booking duration.
              </p>
              <p className="text-slate-600">
                <strong>Preparation:</strong> Customers must ensure that all consoles, controllers, cables, and accessories are properly packed and ready for collection at the scheduled time to avoid delays.
              </p>
              <p className="text-slate-600">
                <strong>Delays & Penalties:</strong> If the customer is unable to facilitate the return at the scheduled time, they must inform After Hours Rental at least 4 hours in advance. Failure to return the product on time will result in additional daily rental charges, late penalties, and potential recovery actions.
              </p>
              <p className="text-slate-600">
                <strong>Safekeeping:</strong> The customer is solely responsible for the safekeeping and timely return of the rented products. In the event of the customer's incapacity, unavailability, or death, such legal and financial responsibility shall pass to the customer's legal heirs, representatives, or estate.
              </p>
            </div>
          </section>

          <section id="section-6" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">06.</span>
              Damage, Loss & Theft Policy
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                The customer agrees to assume absolute financial responsibility for any damage to, loss of, or theft of the equipment during the rental period.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>
                  <strong>Repairable Damage:</strong> For physical or liquid damages that can be repaired (e.g., broken controller joysticks, cracked casing), the customer will be charged the actual repair cost plus a flat ₹500 logistics and handling fee.
                </li>
                <li>
                  <strong>Irreparable Damage:</strong> For damages caused by improper usage, power surges, or severe liquid spills that render the unit beyond repair, the customer must pay the current market replacement cost (MRP) of the product in full.
                </li>
                <li>
                  <strong>Loss or Theft:</strong> Loss, burglary, or theft is not excused under any circumstances. The customer must pay the current market replacement cost (MRP) of the product in full immediately.
                </li>
              </ul>
              <p className="text-slate-600">
                <strong>Transparency:</strong> A separate invoice will be issued for all damage, loss, or theft charges. Failure to clear these charges within 24 hours will result in legal action and the reporting of the customer's details to credit bureaus.
              </p>
            </div>
          </section>

          <section id="section-7" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">07.</span>
              Security Deposit Refund Policy
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                For standard, non-corporate bookings, a fully refundable security deposit is required in addition to the rental charges and booking advance.
              </p>
              <p className="text-slate-600">
                <strong>Instant Refund:</strong> After Hours Rental prides itself on a zero-wait refund policy. Once our pickup executive completes the product quality check at your location and confirms no damages or missing items, the entire security deposit will be refunded to you immediately.
              </p>
              <p className="text-slate-600">
                <strong>Refund Method:</strong> The refund will be processed on the spot via UPI transfer, or our delivery partner will hand it back to you in cash. There are no payment portals, no hidden deductions, and no 3-day waiting periods.
              </p>
            </div>
          </section>

          <section id="section-8" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">08.</span>
              Verification Policy (KYC)
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                All customers must complete a mandatory verification process (KYC) before an order is confirmed and dispatched. This ensures the safety and security of our high-value inventory. After Hours Rental operates on a dual-track verification system:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-500">
                <li>
                  <strong>Track A: Corporate Verification (Zero Security Deposit):</strong> Customers who are working professionals can verify their employment using an official corporate email ID (e.g., name@company.com) alongside a valid Government ID. Successful corporate verification waives the security deposit requirement entirely.
                </li>
                <li>
                  <strong>Track B: Standard Verification (Security Deposit Required):</strong> Customers booking with a personal email address must provide a valid Government ID (such as an Aadhaar card, Driving License, or Passport) along with a complete delivery address and Google Maps pin. A fully refundable security deposit will apply based on the specific equipment tier rented.
                </li>
                <li>
                  <strong>Student Rentals:</strong> Students must provide a valid Student ID Card alongside a standard Government ID. For high-value gaming setups, After Hours Rental reserves the right to request additional verification from a parent or guardian.
                </li>
              </ul>
              <p className="text-slate-600">
                <strong>Approval & Cancellation:</strong> The order is only confirmed once the KYC documents are approved by our operations team. If the verification is incomplete, mismatched, or deemed unsatisfactory, After Hours Rental reserves the right to cancel the order. In such an event, any booking advance paid will be fully refunded to the customer within 24 hours.
              </p>
            </div>
          </section>

          <section id="section-9" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">09.</span>
              Data Privacy Policy
            </h2>
            <p className="text-slate-600">
              We take your privacy seriously. Sensitive personal data (such as Aadhaar, Driving License, or Passport photos) submitted during the KYC verification process is used strictly for identity confirmation and asset protection. Upon the successful completion of your rental return, order cancellation, or upon explicit customer request, this sensitive KYC data will be securely deleted from our active systems.
            </p>
          </section>

          <section id="section-10" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">10.</span>
              Zero Deposit Policy (Corporate Waiver)
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                As part of our commitment to the working professionals of the Delhi NCR region, After Hours Rental offers a "Zero Security Deposit" perk for customers who successfully verify their booking using an official corporate email ID (as outlined in Section 8).
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>
                  <strong>Liability Remains Active:</strong> Please note that waiving the upfront security deposit does not waive your liability for the equipment.
                </li>
                <li>
                  <strong>Responsibility in Case of Damage, Loss, or Theft:</strong> While we trust you will take great care of the gaming setups, in the event of damage, loss, or theft, you remain fully financially responsible under the transparent terms outlined in Section 6.
                </li>
                <li>
                  <strong>Repairable Damage:</strong> Actual repair cost plus a flat ₹500 logistics and handling fee.
                </li>
              </ul>
              <p className="text-slate-600">
                <strong>Invoice Transparency:</strong> To ensure absolute clarity, After Hours Rental will issue a separate, immediate invoice for any charges related to damage, loss, or theft.
              </p>
            </div>
          </section>

          <section id="section-11" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">11.</span>
              Extension & Late Return Policy
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                We understand that sometimes you just want to keep playing! However, because our inventory is often pre-booked for other customers, all rental extensions must be explicitly requested and approved.
              </p>
              <p className="text-slate-600">
                <strong>Approved Extensions:</strong> If you wish to extend your rental tenure, you must notify our operations team before your scheduled return deadline. Extensions are strictly subject to inventory availability. If approved, you will simply be charged the standard daily rental rate (or applicable weekend surge pricing) for the additional days. There are no extra penalty fees for approved extensions.
              </p>
              <p className="text-slate-600">
                <strong>Unapproved Extensions (Late Returns):</strong> If a customer fails to return the product at the scheduled date and time without prior approval from After Hours Rental, it disrupts our delivery pipeline. Unapproved late returns will incur standard rental charges plus a late penalty fee, and will be treated as an unauthorized hold of company equipment.
              </p>
            </div>
          </section>

          <section id="section-12" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">12.</span>
              Governing Law, Jurisdiction and Dispute Resolution
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                These Terms and the use of our services are governed by and construed strictly in accordance with the laws of India.
              </p>
              <p className="text-slate-600">
                <strong>Amicable Settlement:</strong> In the event any dispute or difference arises between the Customer and After Hours Rental in connection with the validity, interpretation, termination, or alleged breach of any provision of these Terms, both parties shall endeavor to settle such dispute amicably within a period of 14 days.
              </p>
              <p className="text-slate-600">
                <strong>Arbitration:</strong> Upon failure to amicably settle any dispute, it shall be resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The dispute shall be resolved by arbitration, administered by an independent online dispute resolution (ODR) institution (such as Presolv360 or similar), in accordance with its Dispute Resolution Rules.
              </p>
              <p className="text-slate-600">
                <strong>Jurisdiction:</strong> The juridical seat of arbitration shall be New Delhi, India. The language of the arbitration shall be English. Subject to the arbitration clause, the competent courts of New Delhi, India shall have the sole and exclusive jurisdiction in respect of any matters which may be instituted before any court of law arising from the services offered by After Hours Rental.
              </p>
            </div>
          </section>

          <section id="section-13" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-black uppercase text-[#003791] font-display mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[#003791]/50">13.</span>
              Cancellation and Refund Policy
            </h2>
            <div className="space-y-3">
              <p className="text-slate-600">
                Because our premium inventory is highly limited, booking an item explicitly blocks other customers from renting it for those dates. Therefore, our cancellation policy is strictly enforced.
              </p>
              <p className="text-slate-600">
                <strong>A) Order cancellation before dispatch:</strong> If you choose to cancel your order before the equipment has been dispatched from our hub, any Security Deposit you have paid will be fully refunded to your original payment method. However, the ₹500 Booking Advance is strictly non-refundable, as it serves as a reservation fee to cover the loss of rental opportunity.
              </p>
              <p className="text-slate-600">
                <strong>B) Order cancellation after dispatch:</strong> Once your order is out for delivery with our rider, we cannot offer a refund on the rental amount under any circumstances. Logistics costs have already been incurred, and the product was exclusively reserved for you. (Note: Your fully refundable security deposit will still be returned to you upon the safe return of the undamaged equipment). We request you to make your booking decisions carefully before confirming.
              </p>
            </div>
          </section>
        </div>

        {/* Footer info box */}
        <div className="mt-12 p-6 bg-[#003791]/5 border border-slate-200 rounded-2xl flex items-start gap-4">
          <Shield className="text-[#003791] shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-sans">
              Legal Commitment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              By placing an order on After Hours Rental, you certify that you have read, understood, and voluntarily accepted all points in the Terms and Conditions agreement above.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
