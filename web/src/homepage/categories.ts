import { categories } from "../tools/categories"

// Homepage presentation only. Keep model order, rotation and animation values.
const models = ["controller", "headphones", "camera", "robot", "color"]
export const SLIDER_FOOD = categories.map((category, index) => ({
  category: category.id,
  name: models[index],
  shortName: category.shortName,
  rot: [0, 0, 0],
  wiggle: 0.4,
  accent: category.accent,
  accentRgb: category.accentRgb,
  copy: {
    name: category.name,
    shortName: category.shortName,
    description: category.description,
  },
  bg: [0x111111, 0x111111, 0x111111],
}))
