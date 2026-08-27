/** Case-insensitive exact match on name or contact. Pure so it's testable without a database. */
export function findMatchingRows(rows, name, contact) {
  const lowerName = (name || "").trim().toLowerCase();
  const lowerContact = (contact || "").trim().toLowerCase();

  return (rows || []).filter((row) => {
    const rowName = (row.name || "").trim().toLowerCase();
    const rowContact = (row.contact || "").trim().toLowerCase();
    return (lowerName && rowName === lowerName) || (lowerContact && rowContact === lowerContact);
  });
}
