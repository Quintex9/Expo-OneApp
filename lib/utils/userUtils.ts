/**
 * Extrahuje meno a priezvisko z emailovej adresy
 * @param email - Emailová adresa (napr. "david.drzik@gmail.com")
 * @returns Objekt s firstName a lastName, alebo null ak sa nedá extrahovať
 */
export function extractNameFromEmail(email: string | null | undefined): {
  firstName: string;
  lastName: string;
} | null {
  if (!email) return null;

  // Odstránime doménu (všetko po @)
  const localPart = email.split('@')[0];
  
  // Rozdelíme podľa bodky
  const parts = localPart.split('.');
  
  if (parts.length >= 2) {
    // Prvá časť = meno, druhá časť = priezvisko
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    return { firstName, lastName };
  } else if (parts.length === 1) {
    // Ak nie je bodka, použijeme celé ako meno
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    return { firstName, lastName: '' };
  }
  
  return null;
}

/**
 * Získa celé meno z emailu (formátované)
 * @param email - Emailová adresa
 * @returns Formátované celé meno alebo email ak sa nedá extrahovať
 */
export function getFullNameFromEmail(email: string | null | undefined): string {
  const name = extractNameFromEmail(email);
  if (name) {
    return name.lastName 
      ? `${name.firstName} ${name.lastName}` 
      : name.firstName;
  }
  return email || 'User';
}

