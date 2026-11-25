// status 0: no answer could be read.
export function failureText(lead: string, status: number): string {
  return status === 0 ? `${lead}: the Console could not be reached.` : `${lead}: the server answered ${status}.`;
}
