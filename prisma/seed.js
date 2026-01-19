/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const GAMES = [
  { 
    id: 'cs-2', 
    name: 'CS 2', 
    slug: 'cs-2', 
    imageUrl: '/images/games/cs-2.jpg', 
    logoUrl: '/images/gamesLogo/cs2.webp', 
    posterUrl: '/images/gamesPoster/cs2.webp' 
  },
  { 
    id: 'valorant', 
    name: 'Valorant', 
    slug: 'valorant', 
    imageUrl: '/images/games/valorant.jpg', 
    logoUrl: '/images/gamesLogo/valorant.png', 
    posterUrl: '/images/gamesPoster/valorant.webp' 
  },
  { 
    id: 'rocket-league', 
    name: 'Rocket League', 
    slug: 'rocket-league', 
    imageUrl: '/images/games/rocket-league.jpg', 
    logoUrl: '/images/gamesLogo/rocket-league.webp', 
    posterUrl: '/images/gamesPoster/rocket-league.webp' 
  },
  { 
    id: 'league-of-legends', 
    name: 'League of Legends', 
    slug: 'league-of-legends', 
    imageUrl: '/images/games/league-of-legends.jpg', 
    logoUrl: '/images/gamesLogo/league-of-legends.png', 
    posterUrl: '/images/gamesPoster/league-of-legends.webp' 
  },
  { 
    id: 'dota-2', 
    name: 'Dota 2', 
    slug: 'dota-2', 
    imageUrl: '/images/games/dota-2.jpg', 
    logoUrl: '/images/gamesLogo/dota-2.png', 
    posterUrl: '/images/gamesPoster/dota-2.webp' 
  },
  { 
    id: 'street-fighter-6', 
    name: 'Street Fighter 6', 
    slug: 'street-fighter-6', 
    imageUrl: '/images/games/street-fighter-6.png', 
    logoUrl: '/images/gamesLogo/street-fighter-6.png', 
    posterUrl: '/images/gamesPoster/street-fighter-6.webp' 
  },
  { 
    id: 'fortnite', 
    name: 'Fortnite', 
    slug: 'fortnite', 
    imageUrl: '/images/games/fortnite.jpg', 
    logoUrl: '/images/gamesLogo/fortnite.png', 
    posterUrl: '/images/gamesPoster/fortnite.webp' 
  },
  { 
    id: 'pubg', 
    name: 'pubg', 
    slug: 'pubg', 
    imageUrl: '/images/games/pubg.jpg', 
    logoUrl: '/images/gamesLogo/pubg.png', 
    posterUrl: '/images/gamesPoster/pubg.webp' 
  },
  { 
    id: 'apex-legends', 
    name: 'Apex Legends', 
    slug: 'apex-legends', 
    imageUrl: '/images/games/apex-legends.jpg', 
    logoUrl: '/images/gamesLogo/apex.png', 
    posterUrl: '/images/gamesPoster/apex-legends.webp' 
  },
  { 
    id: 'call-of-duty-7', 
    name: 'Call of Duty 7', 
    slug: 'call-of-duty-7', 
    imageUrl: '/images/games/call-of-duty-7.jpg', 
    logoUrl: '/images/gamesLogo/call-of-duty-7.png', 
    posterUrl: '/images/gamesPoster/call-of-duty-bo-7.webp' 
  }
]

// 16 meilleures équipes de League of Legends avec 2 joueurs pro chacune
const LOL_TEAMS = [
  {
    name: 'T1',
    description: 'Équipe coréenne légendaire, multiple championne du monde',
    avatarUrl: 'https://ih1.redbubble.net/image.4989426098.3709/flat,750x,075,f-pad,750x1000,f8f8f8.jpg',
    bannerUrl: 'https://mir-s3-cdn-cf.behance.net/project_modules/1400/d4732f139726973.62348ca01d390.png',
    players: [
      { pseudo: 'Faker', email: 'faker@t1.gg', name: 'Lee Sang-hyeok', avatarUrl: 'https://wimg.mk.co.kr/news/cms/202403/11/news-p.v1.20240306.ac31651008994c89a5a1685e903cd5f0_P1.png', bannerUrl: 'https://pbs.twimg.com/media/EEbNTXUUEAA-E2v.jpg' },
      { pseudo: 'Gumayusi', email: 'gumayusi@t1.gg', name: 'Lee Min-hyeong', avatarUrl: 'https://liquipedia.net/commons/images/thumb/c/c2/Gumayusi_Worlds_2022.jpg/450px-Gumayusi_Worlds_2022.jpg', bannerUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/d8d32466-3d6b-46c8-9c41-d5bfcd8cac3c-profile_banner-480.jpeg' }
    ]
  },
  {
    name: 'Gen.G',
    description: 'Équipe coréenne dominante, championne du LCK',
    avatarUrl: 'https://www.eclypsia.com/wp-content/uploads/eclypsia/2022/12/Gen.G-esports.png',
    bannerUrl: 'https://geng.gg/cdn/shop/files/GENG_NextGEN_Banner.png?v=1716460891&width=3000',
    players: [
      { pseudo: 'Chovy', email: 'chovy@geng.gg', name: 'Jeong Ji-hoon', avatarUrl: 'https://pbs.twimg.com/media/GJlksGiXUAAGIdF.jpg', bannerUrl: 'https://pbs.twimg.com/media/FE8oKKeVcAoSeYU.jpg' },
      { pseudo: 'Peyz', email: 'peyz@geng.gg', name: 'Kim Su-hwan', avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYPDpJIA6MJ_drfyzqHdIzHPsyNKSpqKJuNw&s', bannerUrl: 'https://pbs.twimg.com/media/GeKsn3zakAMaxhD.jpg' }
    ]
  },
  {
    name: 'JD Gaming',
    description: 'Équipe chinoise, championne du monde 2023',
    avatarUrl: 'https://cdn.dribbble.com/userupload/31823397/file/original-03d46942f6d834b601c136161eb0fec3.png?resize=752x&vertical=center',
    bannerUrl: 'https://quberten.com/sites/default/files/styles/cover/public/jdg-cover.png?itok=sSgjOgsF',
    players: [
      { pseudo: 'Knight', email: 'knight@jdg.gg', name: 'Zhuo Ding', avatarUrl: 'https://www.lequipe.fr/_medias/img-photo-jpg/au-msi-zhuo-knight-ding-et-jd-gaming-ont-remporte-leur-premier-trophee-international-colin-young-wol/1500000001787408/0:0,1998:1332-1200-800-75/6913a.jpg', bannerUrl: 'https://prod.assets.earlygamecdn.com/images/JDG-Ruler-worlds-2023-semi-finals.jpg?transform=Banner+Webp' },
      { pseudo: 'Ruler', email: 'ruler@jdg.gg', name: 'Park Jae-hyuk', avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/GEN_Ruler_2022.jpg/330px-GEN_Ruler_2022.jpg', bannerUrl: 'https://pbs.twimg.com/media/Ga46wogaIAAksHf.jpg' }
    ]
  },
  {
    name: 'Bilibili Gaming',
    description: 'Équipe chinoise compétitive, finaliste mondiale',
    avatarUrl: 'https://esportbet.com/wp-content/uploads/2024/08/Bilibili-Gaming-LPL-e1725075592909.webp',
    bannerUrl: 'https://pbs.twimg.com/media/GvzgW9NXEAATrFK?format=jpg&name=4096x4096',
    players: [
      { pseudo: 'Yagao', email: 'yagao@blg.gg', name: 'Zeng Qi', avatarUrl: 'https://storage.ensigame.com/logos/players/d2853c41b411f82be8a54f599ea42e7c.png', bannerUrl: 'https://pbs.twimg.com/media/GeP29vmbEAAxuHa.jpg' },
      { pseudo: 'Elk', email: 'elk@blg.gg', name: 'Zhao Jiahao', avatarUrl: 'https://www.eclypsia.com/wp-content/uploads/eclypsia/2023/05/capture-decran-2023-05-22-a-12.58.58.png', bannerUrl: 'https://pbs.twimg.com/media/G614TZ1aEAAZoLV.jpg' }
    ]
  },
  {
    name: 'Top Esports',
    description: 'Équipe chinoise, multiple championne de la LPL',
    avatarUrl: 'https://mir-s3-cdn-cf.behance.net/project_modules/1400/0d2f9582615279.5d234f3b673d2.png',
    bannerUrl: 'https://i.pinimg.com/736x/1f/a5/75/1fa575c788a6daf3448188f583089ffb.jpg',
    players: [
      { pseudo: 'Creme', email: 'creme@tes.gg', name: 'Lin Jian', avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx-QHUc0TQI_UIeHYALLcvrMmYVitxcAbVWw&s', bannerUrl: 'https://stat1-mlycdn.bmyy520.com/lol/Content/images/uploaded/news/81099b7d-2eeb-4d45-b7f9-007d4b44225c.jpg' },
      { pseudo: 'JackeyLove', email: 'jackeylove@tes.gg', name: 'Yu Wenbo', avatarUrl: 'https://a3.espncdn.com/combiner/i?img=%2Fphoto%2F2018%2F1103%2Fr458111_1296x729_16%2D9.jpg', bannerUrl: 'https://e.sport.fr/wp-content/uploads/2025/09/Top_Esports_JackeyLove_at_the_2024_Mid-Season_Invitational.jpg' }
    ]
  },
  {
    name: 'LNG Esports',
    description: 'Équipe chinoise montante, forte en compétition',
    avatarUrl: 'https://yt3.googleusercontent.com/mujSWzebI9f5F3Whws-Sgv60VOMy4achh3u_ArKnl0Vt6m4yy8NvfCr5Cxn7z9ZBuroQCBHl=s900-c-k-c0x00ffffff-no-rj',
    bannerUrl: 'https://pbs.twimg.com/media/D7WDzLRXoAACkoe.jpg',
    players: [
      { pseudo: 'Scout', email: 'scout@lng.gg', name: 'Lee Ye-chan', avatarUrl: 'https://liquipedia.net/commons/images/f/f3/LNG_Scout_Worlds_2024.jpg', bannerUrl: 'https://pbs.twimg.com/media/FlJADqragAEV2ts.jpg' },
      { pseudo: 'GALA', email: 'gala@lng.gg', name: 'Chen Wei', avatarUrl: 'https://e.sport.fr/wp-content/uploads/2024/11/LNG-GALA.jpeg', bannerUrl: 'https://pbs.twimg.com/media/Fw4rmvXagAIZTe-.jpg' }
    ]
  },
  {
    name: 'Weibo Gaming',
    description: 'Équipe chinoise, finaliste mondiale 2023',
    avatarUrl: 'https://static.wikia.nocookie.net/id5/images/9/9c/WeiboGamingOfficial.jpg/revision/latest?cb=20240805140508',
    bannerUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/d/da/WBG_2022_Spring.jpg/revision/latest/scale-to-width-down/1200?cb=20230115134526',
    players: [
      { pseudo: 'Xiaohu', email: 'xiaohu@wbg.gg', name: 'Li Yuanhao', avatarUrl: 'https://storage.ensigame.com/logos/players/be33d4e41afc443b29ea62390bdb4dc5.png', bannerUrl: 'https://s.yimg.com/ny/api/res/1.2/pdfUBCv5xgEP7S8rDXN8sA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02OTk7Y2Y9d2VicA--/https://s.yimg.com/os/creatr-uploaded-images/2022-12/52fe8f90-7c3c-11ed-affb-7c8bc9a0e437' },
      { pseudo: 'Light', email: 'light@wbg.gg', name: 'Wang Guangyu', avatarUrl: 'https://media.trackingthepros.com/profile/p825.png', bannerUrl: 'https://pbs.twimg.com/media/G7POcCqbQAAX5rr?format=jpg&name=small' }
    ]
  },
  {
    name: 'G2 Esports',
    description: 'Équipe européenne, multiple championne de la LEC',
    avatarUrl: 'https://pbs.twimg.com/media/EIRkGM5XkAAXfRN.jpg',
    bannerUrl: 'https://g2esports.com/cdn/shop/files/G2_Esports_Preview_9cd47c91-1f15-49ce-a570-4f198391151e.jpg?v=1752767323',
    players: [
      { pseudo: 'Caps', email: 'caps@g2.gg', name: 'Rasmus Winther', avatarUrl: 'https://img.redbull.com/images/c_crop,x_1100,y_0,h_3715,w_2786/c_fill,w_450,h_600/q_auto,f_auto/redbullcom/2019/11/01/235df54d-e438-4d5d-ab4e-cde90efaca5a/g2-esports-caps', bannerUrl: 'https://esportstalk.com/wp-content/uploads/2021/12/Caps-contract-extension-G2-Esports-700x394.png' },
      { pseudo: 'Hans sama', email: 'hanssama@g2.gg', name: 'Steven Liv', avatarUrl: 'https://pbs.twimg.com/profile_images/1739052897738915840/DbmQYBR6_400x400.jpg', bannerUrl: 'https://media.altchar.com/prod/images/gm_article_promo_image/3c19ecf4ae86-hans-sama-g2.jpg' }
    ]
  },
  {
    name: 'Fnatic',
    description: 'Équipe européenne historique, championne du monde 2011',
    avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSW6HmuViTWcUyPOlv_rROU0Rx9Kac_t10WyA&s',
    bannerUrl: 'https://fnatic.com/images/fnatic-share.png',
    players: [
      { pseudo: 'Humanoid', email: 'humanoid@fnc.gg', name: 'Marek Brázda', avatarUrl: 'https://pbs.twimg.com/media/G0Ufv6WWYAA1zqr.jpg', bannerUrl: 'https://esportsinsider.com/wp-content/uploads/2025/09/fnatic-humanoid.jpg' },
      { pseudo: 'Noah', email: 'noah@fnc.gg', name: 'Oh Hyeon-taek', avatarUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/f/fc/GX_Noah_2026_Split_1.png/revision/latest?cb=20260117095153', bannerUrl: 'https://i.ytimg.com/vi/PwbpDqDwzmo/maxresdefault.jpg' }
    ]
  },
  {
    name: 'MAD Lions',
    description: 'Équipe européenne, multiple championne de la LEC',
    avatarUrl: 'https://scontent-cdg4-1.xx.fbcdn.net/v/t39.30808-6/348240478_263228082735159_1867399792017196595_n.png?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=9lOK_mgYT-AQ7kNvwFwb8K8&_nc_oc=AdmFpxtaWOfrXjoc-1BRBbVCQ45j9cBDENF7lLq_HM1WLRVb7c53hr3MGgpY6cXdun8&_nc_zt=23&_nc_ht=scontent-cdg4-1.xx&_nc_gid=a55p2bHvM4Cmky01hGZpyA&oh=00_AfryoKqcKLWjU8cuLbttoHxtsxR0DTFLqWKjwqfDvxaMxQ&oe=69746E4F',
    bannerUrl: 'https://cdn.uc.assets.prezly.com/e05c35e7-1a0a-4a67-8bfe-5fc77e8874b4/ML_splash_2K.jpg',
    players: [
      { pseudo: 'Elyoya', email: 'elyoya@mad.gg', name: 'Javier Prades', avatarUrl: 'https://pbs.twimg.com/media/FCa6O88WQAgfCbb.jpg', bannerUrl: 'https://www.eclypsia.com/wp-content/uploads/eclypsia/2024/01/52835441998_c1aa045906_k-1024x683.jpg' },
      { pseudo: 'Carzzy', email: 'carzzy@mad.gg', name: 'Matyáš Orság', avatarUrl: 'https://static.invenglobal.com/upload/image/2021/11/22/i1637603279124502.jpeg', bannerUrl: 'https://www.esportstalk.com/wp-content/uploads/2021/10/Carzzy-MAD.jpg' }
    ]
  },
  {
    name: 'Team Liquid',
    description: 'Équipe nord-américaine, championne de la LCS',
    avatarUrl: 'https://assets.tiltify.com/uploads/team/thumbnail/23/a6a2ba82-503c-4b2e-8414-d74b6652320e.jpeg',
    bannerUrl: 'https://nexus.leagueoflegends.com/wp-content/uploads/2019/05/TL-TwitterProfileBanner_lbcubzmtjpv9ffemhazk.jpg',
    players: [
      { pseudo: 'APA', email: 'apa@tl.gg', name: 'Eain Stearns', avatarUrl: 'https://estnn.com/app/uploads/2023/07/tl-apa.jpg', bannerUrl: 'https://esports.gg/_next/image/?url=https%3A%2F%2Fadmin.esports.gg%2Fwp-content%2Fuploads%2F2024%2F10%2FAPA-5-1024x690.jpeg&w=3840&q=75' },
      { pseudo: 'Yeon', email: 'yeon@tl.gg', name: 'Sean Sung', avatarUrl: 'https://lcsprofiles.com/wp-content/uploads/2022/12/tl_yeon.jpg', bannerUrl: 'https://fr.egw.news/_next/image?url=https%3A%2F%2Fegw.news%2Fuploads%2Fnews%2F1669786687357-16x9.webp&w=1920&q=75' }
    ]
  },
  {
    name: 'Cloud9',
    description: 'Équipe nord-américaine, multiple championne de la LCS',
    avatarUrl: 'https://pbs.twimg.com/profile_images/1995542010678456320/iLd1xsgi_400x400.jpg',
    bannerUrl: 'https://cloud9.gg/wp-content/uploads/2024_FallbackBanner_1540x480.png.webp',
    players: [
      { pseudo: 'Fudge', email: 'fudge@c9.gg', name: 'Ibrahim Allami', avatarUrl: 'https://static.invenglobal.com/upload/image/2021/01/17/o1610847103875187.jpeg', bannerUrl: 'https://esports.gg/_next/image/?url=https%3A%2F%2Fadmin.esports.gg%2Fwp-content%2Fuploads%2F2022%2F06%2FFudge-Thumbs-Up-1024x683.jpg&w=3840&q=75' },
      { pseudo: 'Berserker', email: 'berserker@c9.gg', name: 'Kim Min-cheol', avatarUrl: 'https://static.invenglobal.com/upload/image/2022/02/13/o1644728579519802.jpeg', bannerUrl: 'https://static.invenglobal.com/upload/image/2022/10/09/i1665290975216189.png' }
    ]
  },
  {
    name: '100 Thieves',
    description: 'Équipe nord-américaine compétitive',
    avatarUrl: 'https://pbs.twimg.com/profile_images/2011923850213367808/k5dNfn9B_400x400.jpg',
    bannerUrl: 'https://mir-s3-cdn-cf.behance.net/project_modules/max_632_webp/80eada99158023.5ef44e47d725a.png',
    players: [
      { pseudo: 'Quid', email: 'quid@100t.gg', name: 'Kim Gyu-su', avatarUrl: 'https://pbs.twimg.com/media/G4BgQ2PW8AAhgcB?format=jpg&name=small', bannerUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/305f3e3d-723a-401c-bb19-9e33c5892ab7-profile_banner-480.jpeg' },
      { pseudo: 'Meech', email: 'meech@100t.gg', name: 'Meech Choi', avatarUrl: 'https://ih1.redbubble.net/image.3856786986.6097/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg', bannerUrl: 'https://mir-s3-cdn-cf.behance.net/project_modules/disp/6befb099158023.5f43149902ace.png' }
    ]
  },
  {
    name: 'FlyQuest',
    description: 'Équipe nord-américaine, finaliste de la LCS',
    avatarUrl: 'https://pbs.twimg.com/profile_images/1900275980629139456/WPyPU6Zq_400x400.jpg',
    bannerUrl: 'https://pbs.twimg.com/media/Fu1UmPNaQAAG_vE.jpg',
    players: [
      { pseudo: 'Bwipo', email: 'bwipo@fly.gg', name: 'Gabriël Rau', avatarUrl: 'https://pbs.twimg.com/media/G284IHUbYAA75j7.jpg', bannerUrl: 'https://www.lequipe.fr/_medias/img-photo-jpg/bwipo-a-ete-suspendu-par-son-club-apres-des-propos-sexistes-colin-young-wolff-riot-games/1500000002269044/0:0,2000:1333-1200-800-75/9f723.jpg' },
      { pseudo: 'Massu', email: 'massu@fly.gg', name: 'Lee Seong-yeop', avatarUrl: 'https://esports-news.co.uk/wp-content/uploads/2024/10/flyquest-massu-lol-player.jpg', bannerUrl: 'https://admin.esports.gg/wp-content/uploads/2024/06/53807379907_3b1e00130b_k-1024x731.jpg' }
    ]
  },
  {
    name: 'DetonatioN FocusMe',
    description: 'Équipe japonaise, dominante de la LJL',
    avatarUrl: 'https://scontent-cdg4-3.xx.fbcdn.net/v/t39.30808-6/319860536_692073809078881_5301025885744282960_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=dytVp7MNSH0Q7kNvwF8rpWC&_nc_oc=AdkMZte71Di-E-EI8VN23M03YUYRvcIknohMiEsEfFCSTrn_MEPcVZrqS4TWmUdNjTs&_nc_zt=23&_nc_ht=scontent-cdg4-3.xx&_nc_gid=FHOS5sBys1cYLSYS2rT-ng&oh=00_Afqcn0SPkBopkBLryUiNui5qJQIl_bASOO9AtJAhUnaQ6Q&oe=69749564',
    bannerUrl: 'https://team-detonation.net/wp-content/uploads/2024/02/web-bg-min-1.jpg',
    players: [
      { pseudo: 'Aria', email: 'aria@dfm.gg', name: 'Lee Ga-eul', avatarUrl: 'https://liquipedia.net/commons/images/thumb/5/50/DFM_Aria_Worlds_2023.jpg/450px-DFM_Aria_Worlds_2023.jpg', bannerUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/7/7f/Team_DetonatioN_FocusMe_LCP_2026.jpg/revision/latest?cb=20260109123251' },
      { pseudo: 'Yutapon', email: 'yutapon@dfm.gg', name: 'Yuta Sugiura', avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwoYhIg_H5F3rxQnVmNkkn1aV5kB6QalxFWw&s', bannerUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/7/7f/Team_DetonatioN_FocusMe_LCP_2026.jpg/revision/latest?cb=20260109123251' }
    ]
  },
  {
    name: 'PSG Talon',
    description: 'Équipe de la région Asie-Pacifique, championne de la PCS',
    avatarUrl: 'https://scontent-cdg4-2.xx.fbcdn.net/v/t39.30808-6/585203521_1256362353178784_6160683117736291360_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=aho_jxpAN5MQ7kNvwHSV9s7&_nc_oc=AdlR2WbU-qxW5k4jEHS4hycNCFZ_ghQfY-BFH6Zn_DZbv5NnnukiF_DEPU7TcZQp4Dc&_nc_zt=23&_nc_ht=scontent-cdg4-2.xx&_nc_gid=AEh2vQMYLZLDDkRmN7k4tQ&oh=00_Afow0uRREKXtd5rRkLZDthBX6710b3DjhVvxO2t157jOdA&oe=6974A1B8',
    bannerUrl: 'https://scontent-cdg4-1.xx.fbcdn.net/v/t1.6435-9/163394917_1428599080816020_416909874350563053_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=E5ZYcyb58xAQ7kNvwG6qPRf&_nc_oc=AdmySP0VzFWkJ87pEwR8ddVuZHV4Lv-a8J6q4X2PdnKxE2_sZGIHPmESzh1gC2GirFA&_nc_zt=23&_nc_ht=scontent-cdg4-1.xx&_nc_gid=ZxMO_m1st9kYpylWnkR7VQ&oh=00_AfqRQ93EUlmeztEpQBOvLGvlAn43xkDBqldYAG5iHoPBIA&oe=69963349',
    players: [
      { pseudo: 'Maple', email: 'maple@psg.gg', name: 'Huang Yi-Tang', avatarUrl: 'https://pbs.twimg.com/media/Gv31hqtWcAAd_0s?format=jpg&name=small', bannerUrl: 'https://noticias.maisesports.com.br/wp-content/uploads/2020/12/maple-psg-talon.jpeg' },
      { pseudo: 'Wako', email: 'wako@psg.gg', name: 'Tsou Wei-Chiang', avatarUrl: 'https://static-esports.ubisoft.com/esports-platform/common/members/51f07515-5ed8-439e-a07b-f7a99b8e0c64.png', bannerUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/b0/TALON_LCP_2025_Split_1.jpg/revision/latest?cb=20250116143949' }
    ]
  }
]

async function main() {
  console.log('Seeding games...')
  for (const g of GAMES) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: {
        name: g.name,
        imageUrl: g.imageUrl,
        logoUrl: g.logoUrl,
        posterUrl: g.posterUrl
      },
      create: {
        id: g.id,
        name: g.name,
        slug: g.slug,
        imageUrl: g.imageUrl,
        logoUrl: g.logoUrl,
        posterUrl: g.posterUrl
      }
    })
  }
  console.log('Games seeded.')

  console.log('Seeding League of Legends teams and players...')
  const createdTeams = []
  
  for (const teamData of LOL_TEAMS) {
    // Créer l'équipe
    const team = await prisma.team.create({
      data: {
        name: teamData.name,
        description: teamData.description,
        avatarUrl: teamData.avatarUrl || null,
        bannerUrl: teamData.bannerUrl || null
      }
    })
    createdTeams.push(team)
    
    // Créer les 2 joueurs de l'équipe
    const createdPlayers = []
    for (let i = 0; i < teamData.players.length; i++) {
      const player = teamData.players[i]
      const user = await prisma.user.create({
        data: {
          email: player.email,
          pseudo: player.pseudo,
          name: player.name,
          avatarUrl: player.avatarUrl || null,
          bannerUrl: player.bannerUrl || null
        }
      })
      createdPlayers.push(user)
      
      // Ajouter le joueur à l'équipe (le premier est capitaine)
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          isCaptain: i === 0
        }
      })
    }
    
    console.log(`Created team ${teamData.name} with players: ${teamData.players.map(p => p.pseudo).join(', ')}`)
  }
  
  // Vérifier que chaque user fait partie d'une équipe
  const allUsers = await prisma.user.findMany({
    include: {
      teamMembers: true
    }
  })
  
  const usersWithoutTeam = allUsers.filter(user => user.teamMembers.length === 0)
  if (usersWithoutTeam.length > 0) {
    console.warn(`⚠️  Warning: ${usersWithoutTeam.length} user(s) without team: ${usersWithoutTeam.map(u => u.pseudo).join(', ')}`)
  } else {
    console.log('✅ All users are part of a team')
  }
  
  console.log(`Created ${createdTeams.length} teams and ${LOL_TEAMS.length * 2} players.`)
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


