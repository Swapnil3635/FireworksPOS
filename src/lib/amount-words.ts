// Amount in words — Indian numbering (crore / lakh / thousand / hundred).

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function two(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  return n % 10 === 0 ? t : `${t} ${ONES[n % 10]}`;
}

function three(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const head = h > 0 ? `${ONES[h]} Hundred${rest > 0 ? " " : ""}` : "";
  return `${head}${rest > 0 ? two(rest) : ""}`.trim();
}

export function amountInWords(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return "Rupees Zero Only";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore > 0) parts.push(`${three(crore)} Crore`);
  if (lakh > 0) parts.push(`${two(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${two(thousand)} Thousand`);
  if (rest > 0) parts.push(three(rest));
  return `Rupees ${parts.join(" ")} Only`;
}
