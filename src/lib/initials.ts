export function initials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /\p{L}|\p{N}/u.test(word));

  if (words.length === 0) {
    return "L";
  }

  const letters = words
    .slice(0, 2)
    .map(
      (word) =>
        [...word].find((character) => /\p{L}|\p{N}/u.test(character)) ?? "",
    )
    .join("");

  return letters.toUpperCase() || "L";
}
