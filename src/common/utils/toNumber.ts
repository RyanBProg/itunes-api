export const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;

  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};
