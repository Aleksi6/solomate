const path = require("path");

const normalizeImageName = (value = "") =>
  path
    .basename(String(value || ""))
    .normalize("NFC")
    .toLowerCase();

const DEMO_PHOTO_ANALYSES = {
  "图片_草原.jpg": {
    scene_summary: "画面是一片开阔草原，绿色草地一直延伸到远处，天空和地平线把空间感拉得很舒展，像是在旅途中突然遇到的一段安静呼吸。",
    safety_observation: "草原场景视野开阔，但一个人停留时要注意脚下地面、天气变化和返程方向，尽量不要离主路或同行人群太远。",
    photo_advice: "可以把地平线放在画面上三分之一处，让草地承担更多呼吸感；如果有人物背影，会更像一张“独自出发”的旅行明信片。",
    visual_tags: ["草原", "开阔", "自然风景", "绿色", "独处旅行"],
    detected_scene_type: "grassland",
    confidence: 0.96,
    reply_text: "我看到一片很开阔的草原，这张照片适合收进今天的记忆碎片里，像是旅途中给自己留出的一口新鲜空气。",
    task_result: {
      passed: true,
      reward_badge: "自然旷野碎片",
      reason: "照片有明确的旅行现场和自然环境信息，适合作为本次演示的识图分享素材。"
    },
    memory_fragment: {
      id: "demo-grassland-fragment",
      type: "souvenir",
      title: "草原上的一口风",
      description: "一片很开阔的绿色草原，被收进今天的路上。它不像热闹景点，更像独自旅行时突然放松下来的瞬间。",
      tags: ["草原", "自然风景", "放松", "独自旅行"],
      rarity: "rare",
      location: "草原"
    }
  },
  "图片_大海.jpg": {
    scene_summary: "画面里是大海和海岸线，水面铺开得很远，带着清爽、辽阔的旅行感，适合表达一个人走到海边后的松弛。",
    safety_observation: "海边拍照要留意潮水、湿滑礁石和风浪，不要为了构图站到太靠近浪线的位置；独自出行时优先选有人经过的开放区域。",
    photo_advice: "可以让海平面保持水平，把浪花或岸边纹理放在前景；如果想要更有故事感，可以留一点脚印、栏杆或远处人影。",
    visual_tags: ["大海", "海岸", "蓝色", "风景", "松弛"],
    detected_scene_type: "ocean",
    confidence: 0.97,
    reply_text: "这张是很舒服的海边画面，我会把它记成今天的“抵达大海”碎片，适合直接拿去分享。",
    task_result: {
      passed: true,
      reward_badge: "海风记忆碎片",
      reason: "照片包含清晰的大海和旅行目的地线索，适合生成分享文案和日记素材。"
    },
    memory_fragment: {
      id: "demo-ocean-fragment",
      type: "souvenir",
      title: "抵达海边",
      description: "今天的路走到海边，风和水面把心情慢慢摊开。一个人的旅行，也可以有很辽阔的陪伴感。",
      tags: ["大海", "海风", "松弛", "旅行风景"],
      rarity: "rare",
      location: "海边"
    }
  },
  "图片_日落.jpg": {
    scene_summary: "画面是日落时分，天空被暖色光线染开，整体氛围柔和安静，很适合作为一天行程快结束时的记忆节点。",
    safety_observation: "日落后光线会很快变暗，如果一个人继续停留，建议提前确认返程路线，靠近照明更好的主路或人流稳定的位置。",
    photo_advice: "可以稍微压暗曝光保留天空层次，把地面剪影或远处轮廓留进画面，让这张日落更有故事收尾感。",
    visual_tags: ["日落", "晚霞", "暖色", "黄昏", "安静"],
    detected_scene_type: "sunset",
    confidence: 0.98,
    reply_text: "我看到一张很温柔的日落照，它像今天的小结尾，可以放进日记里当作这一页的收束。",
    task_result: {
      passed: true,
      reward_badge: "黄昏收束碎片",
      reason: "照片有明确的日落氛围和时间线索，适合作为当天日记生成的视觉素材。"
    },
    memory_fragment: {
      id: "demo-sunset-fragment",
      type: "souvenir",
      title: "日落替今天收尾",
      description: "黄昏把天空染成暖色，也把今天的行程轻轻收住。适合写进日记，作为一个人旅行里的温柔结尾。",
      tags: ["日落", "黄昏", "温柔", "今日收尾"],
      rarity: "rare",
      location: "日落时分"
    }
  }
};

function findDemoVisionAnalysis(input = {}) {
  const names = [
    input.file?.originalname,
    input.image,
    input.image_name,
    input.file_name,
    input.filename
  ].map(normalizeImageName);

  const matchedName = names.find((name) => DEMO_PHOTO_ANALYSES[name]);
  if (!matchedName) return null;

  return {
    ...DEMO_PHOTO_ANALYSES[matchedName],
    demo_fixture: true,
    demo_image_name: matchedName
  };
}

module.exports = {
  findDemoVisionAnalysis
};
