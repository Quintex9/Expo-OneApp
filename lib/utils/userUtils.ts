// userUtils: utility funkcie pre profil a textove meno pouzivatela.
// Zodpovednost: odvodenie mena z emailu a safe fallbacky.
// Vstup/Vystup: helpery extractNameFromEmail a getFullNameFromEmail.

export function extractNameFromEmail(email: string | null | undefined): {
  firstName: string;
  lastName: string;
} | null {
  if (!email) return null;

  // Cast pred @
  const localPart = email.split('@')[0];
  const parts = localPart.split('.');

  if (parts.length >= 2) {
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    return { firstName, lastName };
  }

  if (parts.length === 1) {
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    return { firstName, lastName: '' };
  }

  return null;
}

// Vrati cele meno, inak fallback na email.
export function getFullNameFromEmail(email: string | null | undefined): string {
  const name = extractNameFromEmail(email);
  if (name) {
    return name.lastName ? `${name.firstName} ${name.lastName}` : name.firstName;
  }
  return email || 'User';
}
