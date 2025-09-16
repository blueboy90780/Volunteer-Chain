export type Voucher = {
  studentWallet: `0x${string}`;
  eventId: string; // unique event identifier
  hours: number;
  role: string;
  ipfsCID: string; // CIDv1 preferred
  nonce: string; // unique per voucher to prevent replay
  deadline: number; // unix timestamp when voucher expires
};

export type SignedVoucher = {
  voucher: Voucher;
  signature: string; // 0x...
};
