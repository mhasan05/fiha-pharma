import { Text, View } from "react-native";

import { LEGAL_EFFECTIVE, type LegalSection } from "@/lib/legal";
import { shadow } from "@/theme";

/** Lowercase Roman numeral for a 1-based index (i, ii, iii, iv, …). */
function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
    [100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
    [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let out = "";
  let num = n;
  for (const [value, sym] of map) {
    while (num >= value) {
      out += sym;
      num -= value;
    }
  }
  return out;
}

/** Renders a list of legal sections (Terms / Privacy) in a clean, readable card.
 *  Each section is numbered; points within a section use Roman numerals. */
export function LegalView({ sections }: { sections: LegalSection[] }): React.ReactElement {
  return (
    <View>
      <Text className="mb-3 text-[12px] text-ink-faint">{LEGAL_EFFECTIVE}</Text>
      <View style={shadow.sm} className="rounded-2xl border border-border bg-surface p-4">
        {sections.map((section, si) => (
          <View key={si} className={si > 0 ? "mt-5" : ""}>
            <Text className="text-[14.5px] font-bold text-ink">{section.title}</Text>
            {section.points.map((p, pi) => (
              <View key={pi} className="mt-2 flex-row">
                <Text className="w-7 text-[13.5px] font-semibold text-primary">{toRoman(pi + 1)}.</Text>
                <Text className="flex-1 text-[13.5px] leading-6 text-ink-soft">{p}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
