// controllers/waifuController.js
import axios from "axios";
const animeGirlCharacters = [
  // === SWORD ART ONLINE ===
  "Asuna Yuuki",
  "Sinon",
  "Lisbeth",
  "Silica",
  "Leafa",
  "Yuuki Konno",
  "Alice Zuberg",
  "Sortiliena Serlut",
  "Selka Zuberg",
  "Cardinal",
  "Quinella",
  "Mito",
  "Argo the Rat",
  "Kureha",

  // === ATTACK ON TITAN ===
  "Mikasa Ackerman",
  "Annie Leonhart",
  "Historia Reiss",
  "Sasha Blouse",
  "Petra Ral",
  "Ymir",
  "Hange Zoe",

  // === NARUTO ===
  "Hinata Hyuga",
  "Sakura Haruno",
  "Tsunade",
  "Temari",
  "Ino Yamanaka",
  "Tenten",
  "Konan",
  "Kushina Uzumaki",
  "Mei Terumi",
  "Karin",
  "Anko Mitarashi",
  "Kurenai Yuhi",
  "Yugao Uzuki",
  "Samui",
  "Karui",

  // === FAIRY TAIL ===
  "Erza Scarlet",
  "Lucy Heartfilia",
  "Wendy Marvell",
  "Juvia Lockser",
  "Mirajane Strauss",
  "Cana Alberona",
  "Levy McGarden",
  "Evergreen",
  "Bisca Mulan",
  "Lisanna Strauss",
  "Mavis Vermillion",
  "Irene Belserion",
  "Brandish",
  "Dimaria Yesta",
  "Kagura Mikazuchi",

  // === RE:ZERO ===
  "Rem",
  "Ram",
  "Emilia",
  "Beatrice",
  "Felt",
  "Crusch Karsten",
  "Anastasia Hoshin",
  "Priscilla Barielle",
  "Frederica Baumann",
  "Petra Leyte",
  "Elsa Granhiert",
  "Ryuzu Meyer",
  "Lewes Meyer",

  // === DARLING IN THE FRANXX ===
  "Zero Two",
  "Ichigo",
  "Miku",
  "Kokoro",
  "Ikuno",

  // === QUINTESSENTIAL QUINTUPLETS ===
  "Miku Nakano",
  "Nino Nakano",
  "Yotsuba Nakano",
  "Itsuki Nakano",
  "Ichika Nakano",

  // === DEMON SLAYER ===
  "Nezuko Kamado",
  "Kanao Tsuyuri",
  "Shinobu Kocho",
  "Mitsuri Kanroji",
  "Aoi Kanzaki",
  "Makomo",
  "Tamayo",

  // === ONE PIECE ===
  "Nico Robin",
  "Nami",
  "Boa Hancock",
  "Perona",
  "Vinsmoke Reiju",
  "Nefertari Vivi",
  "Carrot",
  "Shirahoshi",
  "Yamato",
  "Ulti",
  "Black Maria",
  "Tashigi",
  "Jewelry Bonney",
  "Nico Olvia",

  // === BLEACH ===
  "Rukia Kuchiki",
  "Orihime Inoue",
  "Yoruichi Shihoin",
  "Rangiku Matsumoto",
  "Nelliel Tu Odelschwanck",
  "Retsu Unohana",
  "Soifon",
  "Isane Kotetsu",
  "Nanao Ise",
  "Bambietta Basterbine",
  "Candice Catnipp",
  "Meninas McAllon",

  // === TOARU ===
  "Misaka Mikoto",
  "Shirai Kuroko",
  "Saten Ruiko",
  "Uiharu Kazari",
  "Index",
  "Shokuhou Misaki",
  "Mugino Shizuri",
  "Kinuhata Saiai",
  "Takitsubo Rikou",
  "Seria Kumokawa",
  "Kaori Kanzaki",
  "Itsuwa",
  "Lessar",

  // === DATE A LIVE ===
  "Tohka Yatogami",
  "Kurumi Tokisaki",
  "Yoshino",
  "Kotori Itsuka",
  "Origami Tobiichi",
  "Miku Izayoi",
  "Natsumi",
  "Nia Honjou",
  "Mukuro Hoshimiya",

  // === FATE SERIES ===
  "Saber",
  "Rin Tohsaka",
  "Sakura Matou",
  "Illyasviel von Einzbern",
  "Mash Kyrielight",
  "Jeanne d Arc",
  "Nero Claudius",
  "Scathach",
  "Tamamo no Mae",
  "Artoria Pendragon",
  "Ereshkigal",
  "Ishtar",
  "Mordred",
  "Medusa",
  "Medea",
  "Atalante",
  "Nitocris",
  "Quetzalcoatl",
  "Helena Blavatsky",
  "Okita Souji",
  "Oda Nobunaga",
  "Ryougi Shiki",
  "Altria Pendragon Lancer",
  "Mysterious Heroine X",

  // === KILL LA KILL ===
  "Ryuuko Matoi",
  "Satsuki Kiryuuin",
  "Nonon Jakuzure",
  "Nui Harime",
  "Ragyo Kiryuuin",
  "Mako Mankanshoku",

  // === VIOLET EVERGARDEN ===
  "Violet Evergarden",
  "Cattleya Baudelaire",
  "Erica Brown",
  "Amy Thompson",

  // === SHIELD HERO ===
  "Raphtalia",
  "Melty Q Melromarc",
  "Filo",
  "Glass",
  "Therese",
  "Rishia Ivyred",

  // === OVERLORD ===
  "Albedo",
  "Shalltear Bloodfallen",
  "Aura Bella Fiora",
  "Yuri Alpha",
  "Narberal Gamma",
  "Lupusregina Beta",
  "Solution Epsilon",
  "Entoma Vasilissa Zeta",
  "Evileye",
  "Lakyus Alvein Dale Aindra",

  // === MONOGATARI ===
  "Hitagi Senjougahara",
  "Tsubasa Hanekawa",
  "Shinobu Oshino",
  "Mayoi Hachikuji",
  "Suruga Kanbaru",
  "Nadeko Sengoku",
  "Karen Araragi",
  "Tsukihi Araragi",
  "Yotsugi Ononoki",
  "Ougi Oshino",

  // === MADOKA MAGICA ===
  "Madoka Kaname",
  "Homura Akemi",
  "Sayaka Miki",
  "Mami Tomoe",
  "Kyoko Sakura",

  // === SAILOR MOON ===
  "Sailor Moon",
  "Sailor Mars",
  "Sailor Mercury",
  "Sailor Jupiter",
  "Sailor Venus",
  "Sailor Saturn",
  "Sailor Uranus",
  "Sailor Neptune",
  "Sailor Pluto",
  "Chibiusa",

  // === K-ON ===
  "Yui Hirasawa",
  "Mio Akiyama",
  "Ritsu Tainaka",
  "Tsumugi Kotobuki",
  "Azusa Nakano",

  // === EVANGELION ===
  "Rei Ayanami",
  "Asuka Langley Soryu",
  "Misato Katsuragi",
  "Mari Illustrious Makinami",

  // === HARUHI SUZUMIYA ===
  "Haruhi Suzumiya",
  "Yuki Nagato",
  "Mikuru Asahina",

  // === NO GAME NO LIFE ===
  "Shiro",
  "Stephanie Dola",
  "Jibril",
  "Izuna Hatsuse",

  // === TORADORA ===
  "Taiga Aisaka",
  "Minori Kushieda",
  "Ami Kawashima",

  // === ARIFURETA ===
  "Yue",
  "Shea Haulia",
  "Tio Klarus",
  "Kaori Shirasaki",

  // === ACCEL WORLD ===
  "Kuroyukihime",
  "Yuniko Kozuki",
  "Utai Shinomiya",

  // === TOKYO GHOUL ===
  "Touka Kirishima",
  "Rize Kamishiro",
  "Hinami Fueguchi",

  // === AKAME GA KILL ===
  "Akame",
  "Leone",
  "Mine",
  "Chelsea",
  "Esdeath",
  "Najenda",
  "Sheele",

  // === BLACK LAGOON ===
  "Revy",
  "Balalaika",
  "Roberta",
  "Eda",
  "Shenhua",

  // === MY HERO ACADEMIA ===
  "Ochaco Uraraka",
  "Momo Yaoyorozu",
  "Tsuyu Asui",
  "Kyoka Jiro",
  "Mina Ashido",
  "Toga Himiko",
  "Nejire Hado",
  "Mirko",
  "Mt Lady",
  "Midnight",
  "Eri",
  "Camie Utsushimi",
  "Ibara Shiozaki",
  "Pony Tsunotori",
  "Setsuna Tokage",

  // === BLACK CLOVER ===
  "Noelle Silva",
  "Mimosa Vermillion",
  "Charlotte Roselei",
  "Vanessa Enoteca",
  "Secre Swallowtail",
  "Dorothy Unsworth",
  "Mereleona Vermillion",
  "Lolopechka",

  // === HUNTER X HUNTER ===
  "Biscuit Krueger",
  "Neferpitou",
  "Alluka Zoldyck",
  "Machi Komacine",
  "Shizuku",
  "Pakunoda",
  "Menchi",

  // === DRAGON BALL ===
  "Bulma",
  "Android 18",
  "Chi-Chi",
  "Videl",
  "Caulifla",
  "Kale",
  "Cheelai",

  // === FULLMETAL ALCHEMIST ===
  "Winry Rockbell",
  "Riza Hawkeye",
  "Olivier Armstrong",
  "Lust",
  "Izumi Curtis",
  "Maria Ross",
  "Lan Fan",
  "May Chang",

  // === MUSHOKU TENSEI ===
  "Sylphiette",
  "Roxy Migurdia",
  "Eris Boreas Greyrat",
  "Ghislaine Dedoldia",
  "Zenith Greyrat",

  // === TENSURA / SLIME ===
  "Shion",
  "Shuna",
  "Milim Nava",
  "Treyni",
  "Luminous Valentine",
  "Hinata Sakaguchi",
  "Chloe Aubert",

  // === KONOSUBA ===
  "Aqua",
  "Megumin",
  "Darkness",
  "Wiz",
  "Yunyun",
  "Chris",

  // === GOBLIN SLAYER ===
  "Priestess",
  "High Elf Archer",
  "Sword Maiden",
  "Cow Girl",
  "Guild Girl",

  // === DANMACHI ===
  "Hestia",
  "Ais Wallenstein",
  "Lili Arde",
  "Tiona Hiryute",
  "Tione Hiryute",
  "Riveria Ljos Alf",
  "Freya",
  "Syr Flova",
  "Lefiya Viridis",

  // === HIGHSCHOOL DXD ===
  "Rias Gremory",
  "Akeno Himejima",
  "Koneko Toujou",
  "Asia Argento",
  "Xenovia Quarta",
  "Irina Shidou",
  "Rossweisse",
  "Ravel Phenex",
  "Grayfia Lucifuge",
  "Serafall Leviathan",

  // === INFINITE STRATOS ===
  "Houki Shinonono",
  "Cecilia Alcott",
  "Huang Lingyin",
  "Charlotte Dunois",
  "Laura Bodewig",
  "Chifuyu Orimura",
  "Tatenashi Sarashiki",
  "Kanzashi Sarashiki",

  // === ANGEL BEATS ===
  "Kanade Tachibana",
  "Yuri Nakamura",
  "Iwasawa Masami",

  // === CLANNAD ===
  "Nagisa Furukawa",
  "Kotomi Ichinose",
  "Kyou Fujibayashi",
  "Ryou Fujibayashi",
  "Tomoyo Sakagami",
  "Fuko Ibuki",

  // === STEINS GATE ===
  "Kurisu Makise",
  "Mayuri Shiina",
  "Suzuha Amane",
  "Moeka Kiryu",

  // === SPY X FAMILY ===
  "Yor Forger",
  "Anya Forger",
  "Fiona Frost",

  // === CHAINSAW MAN ===
  "Makima",
  "Power",
  "Himeno",
  "Kobeni Higashiyama",
  "Reze",

  // === JUJUTSU KAISEN ===
  "Nobara Kugisaki",
  "Maki Zenin",
  "Mai Zenin",
  "Mei Mei",
  "Utahime Iori",
  "Miwa Kasumi",
  "Shoko Ieiri",
  "Yuki Tsukumo",

  // === KAGUYA SAMA ===
  "Kaguya Shinomiya",
  "Chika Fujiwara",
  "Miko Iino",

  // === BOCCHI THE ROCK ===
  "Hitori Gotoh",
  "Nijika Ijichi",
  "Ryo Yamada",
  "Ikuyo Kita",

  // === LYCORIS RECOIL ===
  "Chisato Nishikigi",
  "Takina Inoue",

  // === RENT A GIRLFRIEND ===
  "Chizuru Mizuhara",
  "Sumi Sakurasawa",
  "Ruka Sarashina",
  "Mami Nanami",

  // === MISS KOBAYASHI DRAGON MAID ===
  "Tohru",
  "Kanna Kamui",
  "Elma",
  "Lucoa",
  "Ilulu",

  // === OSHI NO KO ===
  "Ai Hoshino",
  "Ruby Hoshino",
  "Kana Arima",
  "Mem Cho",
  "Akane Kurokawa",

  // === FRIEREN ===
  "Frieren",
  "Fern",

  // === IRREGULAR AT MAGIC HIGH ===
  "Miyuki Shiba",
  "Honoka Mitsui",
  "Shizuku Kitayama",
  "Erika Chiba",

  // === ASTERISK WAR ===
  "Julis Alexia von Riessfeld",
  "Saya Sasamiya",
  "Claudia Enfield",

  // === RAKUDAI KISHI ===
  "Stella Vermillion",
  "Shizuku Kurogane",
  "Ayase Ayatsuji",

  // === STRIKE THE BLOOD ===
  "Yukina Himeragi",
  "Asagi Aiba",
  "Sayaka Kirasaka",
  "La Folia Rihavein",

  // === SERAPH OF THE END ===
  "Shinoa Hiragi",
  "Mitsuba Sangu",
  "Krul Tepes",

  // === LOG HORIZON ===
  "Akatsuki",
  "Henrietta",
  "Lenessia",
  "Serara",

  // === KAKEGURUI ===
  "Yumeko Jabami",
  "Mary Saotome",
  "Kirari Momobami",
  "Midari Ikishima",
  "Ririka Momobami",
  "Runa Yomozuki",
  "Itsuki Sumeragi",

  // === FOOD WARS ===
  "Erina Nakiri",
  "Megumi Tadokoro",
  "Alice Nakiri",
  "Ikumi Mito",

  // === ASSASSINATION CLASSROOM ===
  "Kaede Kayano",
  "Irina Jelavic",
  "Yukiko Kanzaki",

  // === CLASSROOM OF THE ELITE ===
  "Suzune Horikita",
  "Kikyou Kushida",
  "Honami Ichinose",
  "Arisu Sakayanagi",

  // === INUYASHA ===
  "Kagome Higurashi",
  "Sango",
  "Kikyo",
  "Rin",

  // === FRUITS BASKET ===
  "Tohru Honda",
  "Arisa Uotani",
  "Saki Hanajima",

  // === OREGAIRU ===
  "Yukino Yukinoshita",
  "Yui Yuigahama",
  "Iroha Isshiki",

  // === HORIMIYA ===
  "Kyouko Hori",
  "Yuki Yoshikawa",

  // === SONO BISQUE DOLL ===
  "Marin Kitagawa",

  // === LOVE LIVE ===
  "Honoka Kosaka",
  "Umi Sonoda",
  "Kotori Minami",
  "Hanayo Koizumi",
  "Rin Hoshizora",
  "Maki Nishikino",
  "Nico Yazawa",
  "Eli Ayase",
  "Nozomi Tojo",

  // === LOVE LIVE SUNSHINE ===
  "Chika Takami",
  "Riko Sakurauchi",
  "Kanan Matsuura",
  "Dia Kurosawa",
  "You Watanabe",
  "Yoshiko Tsushima",
  "Hanamaru Kunikida",
  "Mari Ohara",
  "Ruby Kurosawa",

  // === IDOLMASTER ===
  "Haruka Amami",
  "Miki Hoshii",
  "Chihaya Kisaragi",
  "Yukiho Hagiwara",
  "Yayoi Takatsuki",
  "Iori Minase",
  "Makoto Kikuchi",
  "Azusa Miura",

  // === TOUHOU ===
  "Reimu Hakurei",
  "Marisa Kirisame",
  "Sakuya Izayoi",
  "Remilia Scarlet",
  "Flandre Scarlet",
  "Yukari Yakumo",
  "Yuyuko Saigyouji",
  "Youmu Konpaku",
  "Cirno",
  "Alice Margatroid",
  "Patchouli Knowledge",
  "Sanae Kochiya",
  "Aya Shameimaru",
  "Reisen Udongein Inaba",
  "Eirin Yagokoro",
  "Kaguya Houraisan",
  "Mokou Fujiwara",
  "Keine Kamishirasawa",
  "Tenshi Hinanawi",
  "Iku Nagae",
  "Suika Ibuki",
  "Nitori Kawashiro",
  "Kogasa Tatara",
  "Suwako Moriya",
  "Kanako Yasaka",
  "Ran Yakumo",
  "Chen",
  "Meiling Hong",
  "Koishi Komeiji",
  "Satori Komeiji",
  "Orin",
  "Okuu",

  // === VOCALOID ===
  "Hatsune Miku",
  "Kagamine Rin",
  "Megurine Luka",
  "MEIKO",
  "Gumi",
  "IA",
  "CUL",
  "Yukari Yuzuki",
  "Mayu",
  "Flower",
  "Tohoku Zunko",
  "Akita Neru",
  "Yowane Haku",

  // === GENSHIN IMPACT ===
  "Lumine",
  "Amber",
  "Lisa",
  "Jean",
  "Barbara",
  "Fischl",
  "Noelle",
  "Sucrose",
  "Keqing",
  "Mona",
  "Qiqi",
  "Klee",
  "Ningguang",
  "Beidou",
  "Xiangling",
  "Xinyan",
  "Rosaria",
  "Hu Tao",
  "Ganyu",
  "Xiao",
  "Zhongli",
  "Eula",
  "Yanfei",
  "Kazuha",
  "Ayaka",
  "Yoimiya",
  "Sayu",
  "Kokomi",
  "Raiden Shogun",
  "Sara",
  "Itto",
  "Gorou",
  "Thoma",
  "Shenhe",
  "Yun Jin",
  "Miko Yae",
  "Ayato",
  "Yelan",
  "Shinobu Kuki",
  "Heizou",
  "Collei",
  "Tighnari",
  "Dori",
  "Candace",
  "Cyno",
  "Nilou",
  "Nahida",
  "Layla",
  "Faruzan",
  "Wanderer",
  "Alhaitham",
  "Yaoyao",
  "Dehya",
  "Mika",
  "Baizhu",
  "Kaveh",
  "Kirara",
  "Lynette",
  "Lyney",
  "Freminet",
  "Neuvillette",
  "Wriothesley",
  "Furina",
  "Charlotte Genshin",
  "Navia",
  "Chevreuse",
  "Xianyun",
  "Gaming",
  "Chiori",
  "Arlecchino",
  "Sethos",
  "Clorinde",
  "Sigewinne",
  "Emilie",
  "Kachina",
  "Kinich",
  "Xilonen",
  "Chasca",
  "Ororon",
  "Mavuika",
  "Citlali",

  // === HONKAI STAR RAIL ===
  "Trailblazer",
  "March 7th",
  "Himeko",
  "Welt",
  "Stelle",
  "Kafka",
  "Silver Wolf",
  "Luocha",
  "Blade",
  "Bronya",
  "Seele",
  "Pela",
  "Natasha",
  "Gepard",
  "Serval",
  "Asta",
  "Herta",
  "Sampo",
  "Hook",
  "Arlan",
  "Tingyun",
  "Yukong",
  "Dan Heng",
  "Bailu",
  "Qingque",
  "Sushang",
  "Yanqing",
  "Fu Xuan",
  "Lynx",
  "Guinaifen",
  "Luka Honkai",
  "Gallagher",
  "Sparkle",
  "Black Swan",
  "Misha",
  "Robin Honkai",
  "Boothill",
  "Firefly",
  "Jade",
  "Jiaoqiu",
  "Yunli",
  "Lingsha",
  "Rappa",
  "Sunday",
  "Feixiao",
  "Moze",
  "Remembrance",

  // === BLUE ARCHIVE ===
  "Hoshino",
  "Shiroko",
  "Aru",
  "Junko",
  "Nonomi",
  "Neru",
  "Hina",
  "Iori",
  "Haruka Blue",
  "Mutsuki",
  "Serika",
  "Hanako",
  "Hibiki",
  "Koharu",
  "Fuuka Blue",
  "Tsubaki Blue",
  "Ui",
  "Ako",
  "Azusa Blue",
  "Utaha",
  "Sora Blue",
  "Miku Blue",
  "Natsu Blue",
  "Akari Blue",
  "Ayane Blue",
  "Kotama",
  "Momoi",
  "Midori",
  "Yuzu Blue",
  "Sumire Blue",
  "Iroha Blue",
  "Karin Blue",
  "Asuna Blue",
  "Eimi",
  "Chise",
  "Shizuko",
  "Wakamo",
  "Himari Blue",
  "Miyu Blue",
  "Noa Blue",
  "Rikuhachima Aris",
  "Saori Blue",
  "Moe Blue",
  "Hasumi",

  // === NIKKE ===
  "Yuni",
  "Rapi",
  "Anis",
  "Neon",
  "Rupee",
  "Liter",
  "Noir",
  "Blanc",
  "Alice Nikke",
  "Snow White",
  "Rapunzel",
  "Dorothy Nikke",
  "Cinderella",
  "Maid Privaty",
  "Privaty",
  "Viper",
  "Jackal",
  "Maiden",
  "Scarlet",
  "Modernia",
  "Helm",
  "Diesel",
  "Mihara",
  "Emma",
  "Pepper",
  "Biscuit Nikke",
  "Soda",
  "Nero Nikke",
  "Mary Nikke",
  "Quiry",
  "Dolla",
  "Sugar",
  "Bursting Blueberry",
  "Folkwang",
  "Volume",

  // === ARKNIGHTS ===
  "Amiya",
  "Exusiai",
  "Hoshiguma",
  "Lappland",
  "Texas",
  "Shining",
  "Silverash",
  "Ch'en",
  "Schwarz",
  "Skadi",
  "Angelina",
  "Blaze",
  "Saria",
  "Mostima",
  "Pramanix",
  "Suzuran",
  "Rosa",
  "Ifrit",
  "Nightingale",
  "Ptilopsis",
  "Specter",
  "Hellagur",
  "Eyjafjalla",
  "Kjera",
  "Kal'tsit",
  "W",
  "Saga",
  "Ebenholz",
  "Mudrock",
  "Ceobe",
  "Surtr",
  "Phantom",
  "Magallan",
  "Ashlock",
  "Stainless",
  "Irene Arknights",
  "Flamebringer",
  "Vigil",
  "Degenbrecher",
  "Fartooth",

  // === AZURE LANE ===
  "Enterprise",
  "Belfast",
  "Hood",
  "Illustrious",
  "Unicorn",
  "Atago",
  "Takao",
  "Akagi",
  "Kaga",
  "Zuikaku",
  "Shoukaku",
  "Ayanami",
  "Javelin",
  "Laffey",
  "Z23",
  "Cleveland",
  "Helena",
  "San Diego",
  "Boise",
  "Honolulu",
  "Hammann",
  "Eldridge",
  "Glowworm",
  "Bulldog",
  "Cygnet",
  "Warspite",
  "Queen Elizabeth",
  "Repulse",
  "Renown",
  "Ark Royal",
  "Prinz Eugen",
  "Admiral Hipper",
  "Scharnhorst",
  "Gneisenau",
  "Bismarck",
  "Tirpitz",
  "Graf Zeppelin",
  "Friedrich der Grosse",
  "Roon",
  "Ägir",

  // === GRANBLUE FANTASY ===
  "Lyria",
  "Katalina",
  "Rosetta",
  "Io",
  "Rackam",
  "Eugen",
  "Vira",
  "Zeta",
  "Beatrix Granblue",
  "Narmaya",
  "Cagliostro",
  "Medusa Granblue",
  "Yuel",
  "Societte",
  "Vikala",
  "Belial",
  "Seox",
  "Sandalphon",

  // === FINAL FANTASY ===
  "Terra Branford",
  "Celes Chere",
  "Tifa Lockhart",
  "Aerith Gainsborough",
  "Yuffie Kisaragi",
  "Cloud Strife",
  "Rinoa Heartilly",
  "Quistis Trepe",
  "Selphie Tilmitt",
  "Garnet Til Alexandros",
  "Freya Crescent",
  "Eiko Carol",
  "Yuna",
  "Rikku",
  "Paine",
  "Ashe",
  "Fran",
  "Penelo",
  "Lightning",
  "Serah Farron",
  "Vanille",
  "Fang",
  "Noel Kreiss",
  "Alyssa Zaidelle",

  // === FIRE EMBLEM ===
  "Camilla",
  "Corrin",
  "Lucina",
  "Edelgard",
  "Lysithea",
  "Dorothea",
  "Hilda Fire Emblem",
  "Bernadetta",
  "Petra Fire Emblem",
  "Mercedes",
  "Marianne",
  "Ingrid",
  "Leonie",
  "Shamir",
  "Byleth",
  "Sothis",
  "Eirika",
  "Celica",
  "Nowi",
  "Cordelia",
  "Tharja",
  "Robin Female",
  "Lissa",
  "Maribelle",
  "Sumia",
  "Olivia",
  "Severa",
  "Selena",
  "Azura",
  "Hinoka",
  "Sakura Fire Emblem",
  "Felicia",
  "Flora",

  // === PERSONA ===
  "Yukari Takeba",
  "Mitsuru Kirijo",
  "Fuuka Yamagishi",
  "Aigis",
  "Rise Kujikawa",
  "Naoto Shirogane",
  "Chie Satonaka",
  "Yukiko Amagi",
  "Ann Takamaki",
  "Makoto Niijima",
  "Futaba Sakura",
  "Haru Okumura",
  "Kasumi Yoshizawa",
  "Hifumi Togo",
  "Ohya Ichiko",
  "Tae Takemi",

  // === DANGANRONPA ===
  "Sayaka Maizono",
  "Kyoko Kirigiri",
  "Aoi Asahina",
  "Celestia Ludenberg",
  "Junko Enoshima",
  "Mikan Tsumiki",
  "Chiaki Nanami",
  "Kaede Akamatsu",
  "Miu Iruma",
  "Tenko Chabashira",
  "Himiko Yumeno",
  "Angie Yonaga",
  "Tsumugi Shirogane",

  // === NieR AUTOMATA ===
  "2B",
  "A2",
  "Pod 042",
  "Devola",
  "Popola",

  // === XENOBLADE ===
  "Pyra",
  "Mythra",
  "Nia Xenoblade",
  "Melia",
  "Sharla",
  "Elma Xenoblade",
  "Lin Lee",
  "Lora",

  // === STREET FIGHTER ===
  "Chun Li",
  "Cammy White",
  "Rose",
  "C. Viper",
  "Juri",
  "Ibuki",
  "Sakura Kasugano",

  // === KING OF FIGHTERS ===
  "Mai Shiranui",
  "Athena Asamiya",
  "Blue Mary",
  "King KOF",
  "Leona Heidern",
  "Shermie",
  "Mature",
  "Vice",
  "Yuri Sakazaki",
  "Whip",
  "Vanessa KOF",
  "Angel KOF",
  "Hinako Shijou",
  "Malin",
  "Elisabeth Blanctorche",

  // === MORTAL KOMBAT ===
  "Kitana",
  "Mileena",
  "Jade MK",
  "Sonya Blade",
  "Cassie Cage",
  "Jacqui Briggs",
  "Cetrion",
  "Skarlet",

  // === TEKKEN ===
  "Nina Williams",
  "Anna Williams",
  "Ling Xiaoyu",
  "Asuka Kazama",
  "Lili de Rochefort",
  "Zafina",
  "Josie Rizal",
  "Katarina Alves",

  // === DEAD OR ALIVE ===
  "Kasumi",
  "Ayane",
  "Hitomi",
  "Helena Douglas",
  "Christie",
  "Lei Fang",
  "Lisa Hamilton",
  "Kokoro",
  "Nyotengu",
  "Phase 4",
  "Honoka DOA",
  "Marie Rose",

  // === LEAGUE OF LEGENDS ===
  "Ahri",
  "Lux",
  "Jinx",
  "Miss Fortune",
  "Ashe LOL",
  "Caitlyn",
  "Fiora",
  "Katarina LOL",
  "LeBlanc",
  "Morgana",
  "Nidalee",
  "Orianna",
  "Quinn",
  "Sejuani",
  "Sivir",
  "Soraka",
  "Syndra",
  "Tristana",
  "Vayne",
  "Vi LOL",
  "Zyra",
  "Akali",
  "Irelia",
  "Kai'Sa",
  "Qiyana",
  "Senna",
  "Seraphine",
  "Samira",
  "Gwen LOL",
  "Vex",
  "Zeri",
  "Nilah",
  "K'Sante",
  "Naafiri",

  // === VALORANT ===
  "Jett",
  "Sage",
  "Viper Valorant",
  "Reyna",
  "Skye",
  "Yoru",
  "Astra",
  "KAY/O",
  "Neon Valorant",
  "Pearl",
  "Harbor Valorant",
  "Gekko",
  "Iso",
  "Clove",

  // === OVERWATCH ===
  "Tracer",
  "Widowmaker",
  "Mercy",
  "Pharah",
  "Symmetra",
  "Zarya",
  "Ana",
  "Sombra",
  "Moira",
  "Brigitte",
  "Ashe OW",
  "Echo",
  "Kiriko OW",
  "Ramattra",
  "Lifeweaver",
  "Illari",
  "Mauga",

  // === GENSHIN EXTRA ===
  "Candace Genshin",
  "Dori Genshin",

  // === POKEMON ===
  "Misty",
  "May",
  "Dawn",
  "Iris",
  "Serena",
  "Lillie",
  "Lana",
  "Mallow",
  "Chloe Cerulean",
  "Nessa",
  "Bea",
  "Gloria",
  "Sonia",

  // === ANIMAL CROSSING ===
  "Isabelle",

  // === ZELDA ===
  "Princess Zelda",
  "Midna",
  "Fi",
  "Impa",
  "Urbosa",
  "Mipha",
  "Riju",

  // === METROID ===
  "Samus Aran",

  // === RESIDENT EVIL ===
  "Claire Redfield",
  "Jill Valentine",
  "Ada Wong",
  "Rebecca Chambers",
  "Sheva Alomar",
  "Helena Harper",
  "Phoebe",

  // === DEVIL MAY CRY ===
  "Trish",
  "Lady",
  "Nico DMC",

  // === BLOODBORNE ===
  "Plain Doll",
  "Yharnam",

  // === ELDEN RING ===
  "Melina",
  "Ranni the Witch",
  "Malenia",

  // === DRAGON QUEST ===
  "Jessica Albert",
  "Veronica",
  "Serena DQ",
  "Jade DQ",

  // === TALES SERIES ===
  "Colette Brunel",
  "Raine Sage",
  "Sheena Fujibayashi",
  "Zelos Wilder",
  "Marta Lualdi",
  "Emil Castagnier",
  "Sophie Tales",
  "Cheria Barnes",
  "Hubert Ozwell",
  "Alisha Diphda",
  "Rose Tales",
  "Lailah",
  "Edna",

  // === SWORD ART ONLINE GAME ===
  "Premiere SAO",
  "Strea SAO",

  // === GIRLS FRONTLINE ===
  "M4A1",
  "ST AR-15",
  "M16A1",
  "RO635",
  "UMP45",
  "UMP9",
  "HK416",
  "G36C",
  "Sopmod II",
  "M4 SOPMOD II",
  "Suomi KP31",
  "PPSh-41",
  "Type 100",
  "MP5",
  "PP-2000",
  "WA2000",
  "SVD",
  "Springfield",
  "DSR-50",
  "Kar98k",
  "M200",
  "NTW-20",
  "PTRD",
  "M99 GFL",
  "Carcano M1891",

  // === PUNISHING GRAY RAVEN ===
  "Lucia",
  "Bianca",
  "Nanami",
  "Liv",
  "Selena PGR",
  "Kamui",
  "Lee",
  "Sophia",
  "Vera PGR",
  "Chrome",

  // === EPIC SEVEN ===
  "Yufine",
  "Lidica",
  "Luna E7",
  "Lena",
  "Bellona",
  "Aria",
  "Ravi",
  "Cermia",
  "Vivian",
  "Aramintha",
  "Rin E7",
  "Sez",
  "Destina",
  "Iseria",
  "Tamarinne",

  // === FIRE EMBLEM HEROES ===
  "Veronica FEH",
  "Loki FEH",
  "Fjorm",
  "Gunnthra",
  "Helbindi",

  // === HONKAI IMPACT ===
  "Kiana Kaslana",
  "Mei Raiden",
  "Bronya Zaychik",
  "Himeko Murata",
  "Theresa Apocalypse",
  "Fu Hua",
  "Seele Vollerei",
  "Durandal",
  "Rita Rossweisse",
  "Rozaliya Olenyeva",

  // === AZUR LANE EXTRA ===
  "Unzen",
  "Shinano",
  "Hakuryuu",
  "Amagi Azur",
  "Ibuki Azur",
  "Taihou",
  "Hiryuu",
  "Souryuu",
  "Ryuujou",

  // === PRINCESS CONNECT ===
  "Pecorine",
  "Kokkoro",
  "Kyaru",
  "Yui PC",
  "Shiori PC",
  "Misato PC",
  "Christina PC",
  "Rima",

  // === MAGIA RECORD ===
  "Iroha Tamaki",
  "Yachiyo Nanami",
  "Felicia Mitsuki",
  "Sana Futaba",
  "Momoko Togame",
  "Tsuruno Yui",
  "Mifuyu Azusa",

  // === STAR OCEAN ===
  "Reina Prowel",
  "Rena Lanford",
  "Celine Jules",
  "Sophia Esteed",
  "Mel Kirei",
  "Reina DC",

  // === SWORD ART ONLINE MEMORY DEFRAG ===
  "Koharu SAO",
  "Philia",
  "Seven",

  // === VALKYRIE CONNECT ===
  "Skuld",
  "Verdandi",
  "Urd",

  // === VALKYRIA CHRONICLES ===
  "Alicia Melchiott",
  "Selvaria Bles",
  "Rosie VC",

  // === ATELIER SERIES ===
  "Ryza",
  "Lent Marslink",
  "Klaudia Valentz",
  "Lydie",
  "Suelle",
  "Plachta",
  "Sophie Neuenmuller",
  "Firis",
  "Ilmeria",
  "Lulua",
  "Rorona",

  // === SENRAN KAGURA ===
  "Asuka SK",
  "Homura SK",
  "Yumi SK",
  "Murasaki SK",
  "Hibari",
  "Ikaruga",
  "Katsuragi",
  "Mirai SK",

  // === NEPTUNIA ===
  "Neptune",
  "Noire",
  "Blanc Neptunia",
  "Vert",
  "Plutia",
  "Peashy",
  "Nepgear",
  "Uni",
  "Ram Neptunia",
  "Rom Neptunia",

  // === HYPERDIMENSION EXTRA ===
  "IF",
  "Compa",

  // === TALES OF BERSERIA ===
  "Velvet Crowe",
  "Magilou",

  // === TALES OF SYMPHONIA ===
  "Colette Brunel Extra",

  // === CODE VEIN ===
  "Mia Karnstein",
  "Yakumo Shinonome",

  // === SCARLET NEXUS ===
  "Kasane Randall",
  "Naomi Randall",

  // === NIER REINCARNATION ===
  "The Girl of Light",

  // === ANOTHER EDEN ===
  "Aldo",
  "Feinne",
  "Miyu AE",

  // === DRAGALIA LOST ===
  "Zethia",
  "Notte",

  // === SDORICA ===
  "Angelia",
  "Nolva",
  "Leah",

  // === ARTERY GEAR ===
  "Sonya AG",
  "Yuki AG",

  // === LAST ORIGIN ===
  "Iron Lily",
  "Snow Flower",
  "Phantom Iron",

  // === COUNTER SIDE ===
  "Gaeun",
  "Rifleman",
  "Rosaria CS",

  // === SWORD ART ONLINE VARIANT SHOWDOWN ===
  "Titania",

  // === TOWER OF FANTASY ===
  "Nemesis",
  "Meryl",
  "Cocoritter",
  "Shiro ToF",
  "Samir",
  "Claudia ToF",
  "Huma",
  "Frigg",
  "Tsubasa ToF",

  // === WUTHERING WAVES ===
  "Rover Female",
  "Verina",
  "Jinhsi",
  "Changli",
  "Carlotta",
  "Roccia",
  "Phoebe WW",
  "Shorekeeper",

  // === SNOWBREAK ===
  "Acacia",
  "Fritia",
  "Haru SB",
  "Enya",

  // === PATH TO NOWHERE ===
  "Hamel",
  "Rahu",
  "Wendy PtN",

  // === REVERSE 1999 ===
  "Vertin",
  "Regulus",
  "Sonetto",
  "An-an Lee",
  "Lilya",
  "Jessica R1999",
  "Tooth Fairy",
  "Centurion",

  // === ZENLESS ZONE ZERO ===
  "Belle",
  "Nicole Demara",
  "Nekomata",
  "Koleda",
  "Lucy ZZZ",
  "Zhu Yuan",
  "Ellen Joe",
  "Soukaku",
  "Grace Howard",
  "Jane Doe",
  "Qingyi",
  "Yanagi",
  "Burnice",

  // === PUNISHING GRAY RAVEN EXTRA ===
  "Watanabe",
  "Alisa",

  // === GRAND CHASE ===
  "Elesis",
  "Lire",
  "Arme",
  "Lass",

  // === BRAVE FRONTIER ===
  "Tilith",
  "Seria BF",
  "Eze",

  // === GUARDIAN TALES ===
  "Princess GT",
  "Beth",
  "Nari",
  "Marina GT",

  // === EVERTALE ===
  "Chloe ET",
  "Noel ET",
];

const BLOCKED_PATTERNS = [
  /\bchild\b/i,
  /\bkids?\b/i,
  /\bloli\b/i,
  /\bshota\b/i,
  /\b(\d{1,2})\s?(yo|tahun|year[s]?[- ]?old|살|세|歳)\b/i,
  /elementary/i,
  /grade ?school/i,
  /murid sd/i,
  /anak sd/i,
  /小学生/i, // murid sekolah dasar
  /초등학생/i, // murid sekolah dasar (KR)
];

function containsBlockedContent(text = "") {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

function toFullResImage(url) {
  if (!url) return url;
  return url.replace(/\/c\/\d+x\d+_\d+_[a-zA-Z0-9]+\//, "/");
}

// Ambil deskripsi & metadata lengkap dari endpoint detail
async function fetchPixivDetail(id) {
  try {
    const res = await axios.get(
      `https://neurapi.mochinime.cyou/api/etc/pixiv/detail/${id}`,
    );
    if (!res.data?.success) return null;
    return res.data;
  } catch (err) {
    console.error(`Gagal fetch detail pixiv id=${id}:`, err.message);
    return null;
  }
}

export const getRandomWaifu = async (req, res) => {
  const MAX_ATTEMPTS = 100;

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const randomChar =
        animeGirlCharacters[
          Math.floor(Math.random() * animeGirlCharacters.length)
        ];

      const response = await axios.get(
        `https://neurapi.mochinime.cyou/api/etc/pixiv/search?query=AnimeGril&page=${Math.floor(Math.random() * 60) + 1}`,
      );

      const results = response.data?.data;
      if (!results || results.length === 0) continue; // coba karakter lain

      // Saring dulu hasil yang title-nya jelas-jelas bermasalah,
      // sebelum sempat dipilih random
      const safeResults = results.filter(
        (item) => !containsBlockedContent(item.title),
      );
      if (safeResults.length === 0) continue; // semua hasil ditolak, coba lagi

      const randomImage =
        safeResults[Math.floor(Math.random() * safeResults.length)];

      // Ambil detail (termasuk description) dari endpoint detail
      const detail = await fetchPixivDetail(randomImage.id);

      const description = detail?.description || "";
      const tagsText = (detail?.tags || []).join(" ");

      // Cek ulang dengan data yang lebih lengkap (description + tags),
      // karena title saja kadang tidak cukup mengungkap konteks
      if (
        containsBlockedContent(description) ||
        containsBlockedContent(tagsText)
      ) {
        continue; // tolak, coba karakter/hasil lain
      }

      return res.json({
        success: true,
        character: randomChar,
        image: `https://neurapi.mochinime.cyou/api/etc/pixiv/image?url=${encodeURIComponent(toFullResImage(randomImage.thumbnail))}`,
        link: `https://pixiv.net${randomImage.detail}`,
        title: randomImage.title,
        description: description || null,
        tags: detail?.tags || [],
        user: randomImage.user,
        user_id: randomImage.user_id,
        likeCount: detail?.likeCount ?? null,
        bookmarkCount: detail?.bookmarkCount ?? null,
        viewCount: detail?.viewCount ?? null,
      });
    }

    // Kalau semua percobaan gagal dapat hasil yang aman
    return res.status(404).json({
      success: false,
      message:
        "Tidak ada hasil yang sesuai ditemukan setelah beberapa percobaan.",
    });
  } catch (error) {
    console.error("Error fetching waifu:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data dari API",
      error: error.message,
    });
  }
};
