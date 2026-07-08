import { SUPPORT_MAIL, SUPPORT_PHONE } from "@/lib/constants";

/** A titled block of legal copy (heading + paragraphs/points). */
export interface LegalSection {
  title: string;
  points: string[];
}

export const LEGAL_EFFECTIVE = "Effective date: 1 July 2026";

/** Professional Terms & Conditions for the Fiha Pharma ordering app (shop owners
 *  ordering pharmaceutical products from Fiha Pharma). */
export const TERMS: LegalSection[] = [
  {
    title: "1. Acceptance of Terms",
    points: [
      "By creating an account or placing an order through the Fiha Pharma app, you agree to be bound by these Terms & Conditions and our Privacy Policy.",
      "If you do not agree with any part of these terms, please discontinue use of the app.",
    ],
  },
  {
    title: "2. Eligibility & Accounts",
    points: [
      "The Fiha Pharma app is intended for registered pharmacies and retail shop owners. Accounts are approved and activated by Fiha Pharma.",
      "You are responsible for the accuracy of your shop details and for keeping your login credentials confidential.",
      "You are responsible for all activity that occurs under your account.",
    ],
  },
  {
    title: "3. Orders & Pricing",
    points: [
      "Product prices, discounts and availability are shown in the app and may change without prior notice.",
      "Placing an order is an offer to purchase; an order is confirmed once accepted and processed by Fiha Pharma.",
      "We may limit, cancel or adjust quantities where stock is unavailable, and will notify you of any change.",
    ],
  },
  {
    title: "4. Delivery",
    points: [
      "Orders are delivered to the shop address on your account, within the areas serviced by Fiha Pharma.",
      "Delivery times are estimates and may vary due to demand, location or circumstances beyond our control.",
      "Any applicable delivery charge is shown before you place the order.",
    ],
  },
  {
    title: "5. Payment & Outstanding Dues",
    points: [
      "Payment is collected against each invoice as agreed at the time of delivery.",
      "Any amount not paid on a delivered order is recorded as an outstanding due on your account.",
      "You agree to clear outstanding dues promptly. Fiha Pharma may pause new orders while dues remain unpaid.",
    ],
  },
  {
    title: "6. Returns",
    points: [
      "Returns are handled at the time of delivery in line with Fiha Pharma's return policy and are subject to verification.",
      "Special discounts may not apply to returned items, and adjustments will be reflected on the invoice.",
    ],
  },
  {
    title: "7. Product Information & Responsibility",
    points: [
      "Product names, descriptions and images are provided for reference and may differ slightly from the packaging supplied.",
      "As a licensed retailer, you are responsible for the lawful storage, handling and sale of all pharmaceutical products.",
    ],
  },
  {
    title: "8. Suspension & Termination",
    points: [
      "Fiha Pharma may suspend or terminate an account for misuse, unpaid dues, or violation of these terms.",
      "You may request account closure by contacting support.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    points: [
      "The app is provided on an \"as is\" basis. To the extent permitted by law, Fiha Pharma is not liable for indirect or consequential losses arising from use of the app.",
    ],
  },
  {
    title: "10. Changes to These Terms",
    points: [
      "We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "11. Contact",
    points: [
      `For any questions about these terms, contact us at ${SUPPORT_PHONE} or ${SUPPORT_MAIL}.`,
    ],
  },
];

/** Professional Privacy Policy (used as a fallback when the backend has none). */
export const PRIVACY: LegalSection[] = [
  {
    title: "1. Information We Collect",
    points: [
      "Account details you provide: name, email, phone number, shop name, shop address and area.",
      "Order and payment records, including invoices, collected amounts and outstanding dues.",
      "Device information such as your notification (push) token, used only to deliver order updates.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    points: [
      "To create and manage your account and process, deliver and invoice your orders.",
      "To send you order-status and delivery notifications and important service messages.",
      "To provide customer support and improve the reliability of our service.",
    ],
  },
  {
    title: "3. Notifications",
    points: [
      "With your permission, we send push notifications for events such as order confirmation, dispatch and delivery.",
      "You can disable notifications at any time from your device settings.",
    ],
  },
  {
    title: "4. Sharing of Information",
    points: [
      "We share only the information necessary to fulfil your orders, for example with the delivery agent assigned to you.",
      "We do not sell your personal information to third parties.",
    ],
  },
  {
    title: "5. Data Security & Retention",
    points: [
      "We take reasonable measures to protect your information and retain it only as long as needed for our services and legal obligations.",
    ],
  },
  {
    title: "6. Your Rights",
    points: [
      "You may review or update your profile details in the app, or request correction or deletion of your data by contacting support.",
    ],
  },
  {
    title: "7. Contact",
    points: [
      `For privacy questions, contact us at ${SUPPORT_PHONE} or ${SUPPORT_MAIL}.`,
    ],
  },
];
