import { Pressable, Text, View } from "react-native";

import { Ionicons } from "@/components/Icon";
import { Img } from "@/components/Img";
import { mediaUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { STOCK_TINT, stockState } from "@/lib/stock";
import { shadow, useColors } from "@/theme";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/api";

/**
 * IMPORTANT: this card renders inside virtualized FlatLists. NativeWind resolves
 * `className` on a deferred pass that can be skipped for list items on the first
 * (cold-start) render — which collapsed the cards to thin lines until any
 * re-render (e.g. toggling theme/language). To make it bulletproof, all layout
 * and colors here use plain React Native styles (colors from the synchronous
 * `useColors()` palette), so the card always has correct geometry on first paint.
 */
export function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress?: () => void;
}): React.ReactElement {
  const t = useT();
  const c = useColors();
  const qty = useCartStore((s) => s.qtyOf(product.product_id));
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);

  const img = mediaUrl(product.product_image, product.updated_on);
  const discountPct = Number(product.discount_percent) || 0;
  const hasDiscount = product.mrp > product.selling_price && discountPct > 0;
  const perBox = Number(product.quantity_per_box) || 0;
  const stock = stockState(product);
  const soldOut = stock === "out";
  const tint = soldOut ? "#0F9D6E" : STOCK_TINT[stock];
  const chipBtn = { height: 28, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.25)" } as const;
  const ACTION_H = 44;

  return (
    <Pressable
      onPress={onPress}
      style={[shadow.sm, { flex: 1, overflow: "hidden", borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }]}
    >
      {/* Image + badges */}
      <View style={{ height: 112, alignItems: "center", justifyContent: "center", backgroundColor: c.surface }}>
        {img ? (
          <Img source={{ uri: img }} style={{ width: "82%", height: 88 }} contentFit="contain" />
        ) : (
          <Ionicons name="cube-outline" size={40} color={c.inkFaint} />
        )}
        {hasDiscount ? (
          <View style={{ position: "absolute", left: 0, top: 0, backgroundColor: "#F97316", borderBottomRightRadius: 16, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>{discountPct.toFixed(1)}% Off</Text>
          </View>
        ) : null}
        {perBox > 0 ? (
          <View style={{ position: "absolute", bottom: 6, right: 6, backgroundColor: c.primary50, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: "600", color: c.inkMuted }}>{perBox} pcs</Text>
          </View>
        ) : null}
        {soldOut ? (
          <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.45)" }}>
            <View style={{ backgroundColor: c.danger, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: c.white }}>{t("outOfStock")}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: c.ink }}>{product.product_name}</Text>
        {product.generic_name ? (
          <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 11, color: c.inkMuted }}>{product.generic_name}</Text>
        ) : null}
        <Text numberOfLines={1} style={{ fontSize: 11, color: c.inkFaint }}>{product.company_name}</Text>

        <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8 }}>
          {hasDiscount ? (
            <Text style={{ fontSize: 12, color: c.inkFaint, textDecorationLine: "line-through" }}>{formatPrice(product.mrp)}</Text>
          ) : null}
          <Text style={{ fontSize: 15, fontWeight: "800", color: c.danger }}>{formatPrice(product.selling_price)}</Text>
        </View>
      </View>

      {/* Action — fixed height across all states (Add To Cart / stepper /
          Out of Stock) so the card never changes height when added to cart. */}
      {soldOut ? (
        <View style={{ height: ACTION_H, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: c.danger }}>
          <Ionicons name="close-circle-outline" size={15} color={c.white} />
          <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: "700", color: c.white }}>{t("outOfStock")}</Text>
        </View>
      ) : qty > 0 ? (
        <View style={{ height: ACTION_H, backgroundColor: tint, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 }}>
          <Pressable onPress={() => setQty(product.product_id, qty - 1)} hitSlop={8} style={chipBtn}>
            <Ionicons name="remove" size={16} color={c.white} />
          </Pressable>
          <Text style={{ fontSize: 14, fontWeight: "700", color: c.white }}>{qty}</Text>
          <Pressable onPress={() => add(product)} hitSlop={8} style={chipBtn}>
            <Ionicons name="add" size={16} color={c.white} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => add(product)} style={{ height: ACTION_H, backgroundColor: tint, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: c.white }}>{t("addToCart")}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
