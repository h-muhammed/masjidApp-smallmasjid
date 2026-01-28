export interface DonationTypeConfig {
  value: string;
  label: string;
  needsAmount: boolean;
  needsQuantity: boolean;
}

export const DONATION_TYPES: DonationTypeConfig[] = [
  {
    value: "zakat",
    label: "Zakat",
    needsAmount: true,
    needsQuantity: false,
  },
  {
    value: "dry_ration_pack",
    label: "Dry Ration Pack",
    needsAmount: false,
    needsQuantity: true,
  },
  {
    value: "other_help",
    label: "Other Help",
    needsAmount: true,
    needsQuantity: true, // Optional for both
  },
];

export const getDonationTypeConfig = (type: string): DonationTypeConfig | undefined => {
  return DONATION_TYPES.find((dt) => dt.value === type);
};
