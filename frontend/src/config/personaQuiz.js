const personaQuiz = {
  intro: {
    title: '搭子共创向导',
    subtitle: '一起把今天的旅行搭子捏出来。慢慢选，最后会生成一位专属于你的长期旅伴。',
  },
  questions: [
    {
      id: 'personality',
      title: '你想要一个什么气质的搭子？',
      type: 'single',
      options: [
        { id: 'gentle', label: '温柔陪伴', description: '先接住情绪，再一起往前走。', personaId: 'gentle_friend' },
        { id: 'guide', label: '本地熟路', description: '更像懂路线也懂城市的人。', personaId: 'local_guide' },
        { id: 'photo', label: '画面感强', description: '会陪你一起看光线和瞬间。', personaId: 'photo_buddy' },
        { id: 'planner', label: '清醒规划', description: '少绕路，帮你做清楚判断。', personaId: 'budget_planner' },
        { id: 'sprite', label: '轻任务感', description: '给你一点小目标和出发动机。', personaId: 'game_sprite' },
      ],
    },
    {
      id: 'speakingStyle',
      title: 'TA 说话最好是什么感觉？',
      type: 'single',
      options: [
        { id: 'soft', label: '轻轻的', description: '像熟人陪你说话，不会催你。' },
        { id: 'clear', label: '清楚直接', description: '短一点，重点很明确。' },
        { id: 'playful', label: '有点可爱', description: '会有一点点轻松的互动感。' },
      ],
    },
    {
      id: 'decisionStyle',
      title: '遇到选择时，你更希望 TA 怎么帮你？',
      type: 'single',
      options: [
        { id: 'listen-first', label: '先听我说完', description: '先把我的犹豫接住。' },
        { id: 'give-options', label: '列出几个可行选项', description: '让我更容易做选择。' },
        { id: 'recommend-one', label: '直接推荐一个', description: '我想要更果断一点的帮助。' },
      ],
    },
    {
      id: 'safetyLevel',
      title: '安全提醒希望是什么强度？',
      type: 'single',
      options: [
        { id: 'gentle', label: '轻提醒', description: '温柔提一句就够了。' },
        { id: 'balanced', label: '刚刚好', description: '重要时说，别太打断心情。' },
        { id: 'strong', label: '请认真提醒我', description: '夜路、偏僻、独处时都说清楚。' },
      ],
    },
    {
      id: 'taskPreference',
      title: '今天的旅行任务更想偏向哪种？',
      type: 'single',
      options: [
        { id: 'restful', label: '轻松散步', description: '低压力，像散步中顺手完成。' },
        { id: 'city-discovery', label: '城市探索', description: '更想去发现街区和小地点。' },
        { id: 'collecting', label: '收集成就', description: '想有一点完成感和解锁感。' },
      ],
    },
    {
      id: 'photoPreference',
      title: '关于拍照和纪念物，TA 更应该懂什么？',
      type: 'single',
      options: [
        { id: 'scene', label: '看环境氛围', description: '帮我读懂我现在身处的地方。' },
        { id: 'souvenir', label: '收集纪念物', description: '更懂怎么把瞬间变成碎片卡片。' },
        { id: 'both', label: '两个都懂', description: '既能看世界，也能帮我收藏世界。' },
      ],
    },
    {
      id: 'voiceStyle',
      title: 'TA 的声音风格，你更喜欢哪种？',
      type: 'single',
      options: [
        { id: 'warm', label: '温暖柔和', description: '像近一点的陪伴。', defaultVoiceSettings: { rate: 0.95, pitch: 1.05, voiceURI: '' } },
        { id: 'calm', label: '安静平稳', description: '不抢戏，让人放松。', defaultVoiceSettings: { rate: 0.9, pitch: 0.95, voiceURI: '' } },
        { id: 'bright', label: '轻亮有精神', description: '带一点鼓励感。', defaultVoiceSettings: { rate: 1, pitch: 1.1, voiceURI: '' } },
      ],
    },
    {
      id: 'customName',
      title: '最后，给这位搭子起个名字吧',
      type: 'text',
      placeholder: '比如：小陪、小灯、晚风、慢慢',
      helper: '不填也可以，系统会先给一个默认名字。',
    },
  ],
}

export default personaQuiz
