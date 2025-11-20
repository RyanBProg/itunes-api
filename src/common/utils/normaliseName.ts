export function normaliseName(name: string) {
  return name.replace(/^(the|a|an)\s+/i, '').trim();
}
