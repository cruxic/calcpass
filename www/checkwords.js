var CHECKWORDS = [
"abide",
"about",
"above",
"absurd",
"accept",
"acceptance",
"accessible",
"accident",
"accordance",
"account",
"active",
"addition",
"additional",
"admire",
"admittance",
"adoption",
"advance",
"advantage",
"advice",
"advisable",
"advise",
"affectionate",
"afford",
"afore",
"afraid",
"after",
"again",
"against",
"agent",
"agony",
"agree",
"agreement",
"alarm",
"alive",
"allow",
"almost",
"alone",
"along",
"already",
"alternate",
"altogether",
"among",
"ancient",
"anger",
"angry",
"animal",
"another",
"answer",
"anxiety",
"anybody",
"anyone",
"anywhere",
"appear",
"appearance",
"applicable",
"approach",
"archbishop",
"argue",
"argument",
"arise",
"armour",
"around",
"arrange",
"array",
"asleep",
"assistance",
"assure",
"attempt",
"attention",
"authority",
"available",
"avoid",
"awhile",
"awkward",
"balance",
"barrowful",
"battle",
"beamish",
"beard",
"beautiful",
"beautify",
"became",
"because",
"become",
"before",
"began",
"begin",
"begun",
"behind",
"believe",
"belong",
"below",
"beneath",
"better",
"between",
"beyond",
"birthday",
"bitter",
"black",
"blade",
"blame",
"blaze",
"blown",
"bolster",
"bonfire",
"border",
"bother",
"bottle",
"bottom",
"bough",
"bought",
"bound",
"branch",
"brave",
"bread",
"break",
"breath",
"breathe",
"breeze",
"bridge",
"bright",
"briny",
"broad",
"broke",
"broken",
"brooch",
"brook",
"brother",
"brought",
"brown",
"brush",
"bunch",
"burst",
"bushy",
"butter",
"buttercup",
"calculate",
"calmer",
"camomile",
"candle",
"cannot",
"capital",
"careful",
"carriage",
"carry",
"carve",
"catch",
"cattle",
"caught",
"cauldron",
"cause",
"cease",
"centre",
"certain",
"chance",
"change",
"charge",
"charitable",
"cheap",
"cheaper",
"check",
"cheer",
"chessmen",
"chief",
"child",
"children",
"chimney",
"choke",
"choose",
"chose",
"chosen",
"civil",
"claim",
"clamour",
"clasp",
"clean",
"clear",
"clearer",
"clever",
"cleverest",
"climb",
"clock",
"close",
"closer",
"cloud",
"coast",
"collection",
"comfort",
"comfortable",
"commercial",
"common",
"commotion",
"companion",
"company",
"comparison",
"compilation",
"complain",
"compliance",
"computer",
"concept",
"concert",
"conclusion",
"condemn",
"conduct",
"confirmation",
"confusion",
"consequence",
"consider",
"considerable",
"constant",
"consultation",
"contact",
"contain",
"content",
"convenient",
"conversation",
"convert",
"copper",
"copyright",
"corkscrew",
"corner",
"corporation",
"correct",
"corrupt",
"could",
"count",
"country",
"couple",
"courage",
"course",
"court",
"crash",
"cravat",
"cream",
"creation",
"creature",
"credit",
"creep",
"crept",
"crime",
"crimson",
"critical",
"crocodile",
"croquet",
"crowd",
"crown",
"curiosity",
"current",
"curtain",
"curtsey",
"custody",
"damage",
"dance",
"danger",
"daresay",
"darker",
"daughter",
"declare",
"deductible",
"deepest",
"defect",
"defective",
"delay",
"delight",
"delightful",
"demand",
"derivative",
"derive",
"design",
"despair",
"desperate",
"destroy",
"detach",
"determine",
"difference",
"different",
"difficult",
"difficulty",
"dinner",
"direction",
"disagree",
"disappointment",
"disbelieve",
"disclaim",
"disclaimer",
"discontinue",
"discover",
"dishcover",
"dismal",
"dispute",
"disrespectful",
"distance",
"distant",
"distinct",
"distinguish",
"distribute",
"distribution",
"ditch",
"domain",
"donate",
"donation",
"doorway",
"double",
"doubt",
"doubtful",
"drank",
"drawl",
"dreadful",
"dream",
"dreamy",
"driest",
"drift",
"drink",
"drive",
"drunk",
"dusty",
"eager",
"earlier",
"earth",
"easier",
"easiest",
"eaten",
"educational",
"effect",
"effort",
"eight",
"either",
"elbmig",
"elbow",
"eldest",
"elect",
"electronic",
"elegant",
"eleventh",
"email",
"employee",
"empty",
"encourage",
"enemy",
"energetic",
"enjoy",
"enough",
"entity",
"entrance",
"equipment",
"escape",
"etiquette",
"every",
"everybody",
"everywhere",
"evidence",
"exact",
"examination",
"excellent",
"except",
"excitement",
"exclamation",
"exclusion",
"excuse",
"execute",
"executioner",
"exempt",
"expect",
"expend",
"expense",
"experiment",
"explain",
"explanation",
"expression",
"extent",
"extraordinary",
"faint",
"fallen",
"fancy",
"farther",
"fasten",
"faster",
"fault",
"favour",
"favourite",
"fearful",
"feather",
"federal",
"feeble",
"fetch",
"feverish",
"field",
"fifteen",
"fifth",
"fifty",
"fight",
"figure",
"financial",
"finger",
"finish",
"fireplace",
"first",
"flame",
"flamingo",
"flapper",
"flavour",
"flock",
"flower",
"flown",
"flung",
"flurry",
"follow",
"foolish",
"footman",
"forehead",
"forest",
"forget",
"forgot",
"forgotten",
"format",
"forth",
"found",
"fourteen",
"fourth",
"fresh",
"fretful",
"friend",
"fright",
"frighten",
"front",
"frontispiece",
"frothy",
"funny",
"furrow",
"further",
"future",
"garden",
"gather",
"general",
"gentle",
"gentleman",
"giddy",
"gimble",
"given",
"globe",
"glory",
"golden",
"goldfish",
"govern",
"graceful",
"grand",
"grander",
"grant",
"grassy",
"grave",
"great",
"greater",
"green",
"ground",
"group",
"growl",
"grown",
"guard",
"gunpowder",
"habit",
"handkerchief",
"handle",
"handsome",
"handy",
"happen",
"happy",
"haste",
"headlong",
"heard",
"heart",
"hearth",
"heather",
"heavy",
"hedgehog",
"height",
"helmet",
"herself",
"higher",
"highest",
"himself",
"history",
"hoarse",
"holder",
"hollow",
"honest",
"honey",
"honour",
"hookah",
"hopeful",
"horror",
"horse",
"house",
"however",
"human",
"humble",
"hungry",
"hurricane",
"hurry",
"hypertext",
"identification",
"ignorant",
"imagine",
"immediate",
"immense",
"impatient",
"imperial",
"important",
"impossible",
"inaccurate",
"include",
"inconvenient",
"indemnify",
"indicate",
"indignant",
"individual",
"information",
"injure",
"inkstand",
"insect",
"insolence",
"instead",
"insult",
"intellectual",
"interest",
"interrupt",
"introduce",
"invalidity",
"invent",
"invention",
"invisible",
"invitation",
"invite",
"irritation",
"itself",
"joint",
"journey",
"juror",
"jurymen",
"justice",
"kettle",
"kinder",
"kitchen",
"kitten",
"kneel",
"knelt",
"knife",
"knight",
"knowledge",
"known",
"label",
"ladle",
"language",
"large",
"larger",
"largest",
"later",
"laugh",
"leant",
"learn",
"learnt",
"least",
"leave",
"ledge",
"lefthand",
"legal",
"length",
"lessen",
"lesson",
"letter",
"liability",
"library",
"license",
"light",
"limitation",
"listen",
"little",
"livery",
"lobster",
"longer",
"loose",
"louder",
"loveliest",
"lower",
"lullaby",
"machine",
"magic",
"majesty",
"manage",
"manner",
"manxome",
"master",
"matter",
"maximum",
"mayhap",
"meant",
"meanwhile",
"measure",
"medium",
"memorandum",
"memory",
"mention",
"merry",
"message",
"messenger",
"method",
"middle",
"midst",
"might",
"mimsy",
"mince",
"minute",
"mischief",
"miserable",
"mission",
"mistake",
"model",
"moment",
"money",
"month",
"moral",
"morsel",
"mournful",
"mouse",
"mouth",
"muddle",
"murder",
"muscular",
"mushroom",
"music",
"mustard",
"mutton",
"myself",
"narrow",
"nasty",
"natural",
"nearer",
"nearest",
"neighbour",
"neither",
"nestle",
"network",
"never",
"newsletter",
"night",
"nightcap",
"noble",
"nobody",
"noise",
"noisy",
"nonproprietary",
"nonsense",
"notice",
"notion",
"nowhere",
"number",
"nurse",
"oblong",
"observe",
"obstacle",
"obstinacy",
"obtain",
"occasion",
"occasional",
"oddest",
"offend",
"offer",
"office",
"officer",
"official",
"often",
"older",
"oldest",
"oneself",
"online",
"onward",
"opinion",
"opportunity",
"opposite",
"order",
"original",
"originator",
"other",
"otherwise",
"ought",
"outside",
"overcome",
"overheard",
"owner",
"paint",
"paper",
"paperwork",
"paragraph",
"parchment",
"particular",
"party",
"passage",
"passionate",
"patience",
"patriotic",
"pattern",
"pause",
"pencil",
"people",
"pepper",
"perfect",
"periodic",
"permanent",
"permission",
"person",
"personal",
"phrase",
"physical",
"piece",
"pigeon",
"pinch",
"place",
"plaintive",
"plaster",
"plate",
"pleasant",
"pleasanter",
"please",
"pleasure",
"plenty",
"pocket",
"poetry",
"point",
"poker",
"porcupine",
"porpoise",
"portmanteau",
"position",
"possible",
"practice",
"prepare",
"present",
"preserve",
"pretend",
"prettiest",
"pretty",
"prevent",
"principal",
"print",
"prison",
"prisoner",
"privilege",
"prize",
"procession",
"produce",
"profit",
"prohibition",
"promotion",
"proofread",
"proper",
"property",
"proprietary",
"prosecute",
"protect",
"proud",
"prove",
"provide",
"provision",
"public",
"punish",
"punishment",
"puppy",
"purchase",
"purpose",
"puzzle",
"quantity",
"quarrel",
"quarter",
"queen",
"queer",
"queerest",
"question",
"quick",
"quiet",
"quite",
"quiver",
"quoth",
"rabbit",
"railway",
"raisin",
"rapid",
"rather",
"rattle",
"raven",
"reach",
"readable",
"ready",
"realler",
"reason",
"reasonable",
"receipt",
"receive",
"redistribute",
"refund",
"regular",
"rejoice",
"remain",
"remark",
"remarkable",
"remember",
"remove",
"repeat",
"replace",
"replacement",
"require",
"research",
"resistance",
"respectable",
"respectful",
"result",
"retire",
"return",
"rhyme",
"ribbon",
"riddle",
"rider",
"ridge",
"right",
"righthand",
"riper",
"roast",
"rough",
"round",
"rounder",
"royal",
"royalty",
"safer",
"sandwich",
"saucepan",
"saucer",
"savage",
"scene",
"scent",
"sceptre",
"school",
"scold",
"scornful",
"scream",
"scroll",
"search",
"seaside",
"second",
"secure",
"seldom",
"sensation",
"sense",
"sensible",
"sentence",
"servant",
"settle",
"seven",
"several",
"severe",
"sevot",
"shade",
"shaggy",
"shake",
"shall",
"shape",
"share",
"sharp",
"sharper",
"shawl",
"sheep",
"shelf",
"shepherd",
"shine",
"shock",
"shook",
"short",
"should",
"shoulder",
"shout",
"shower",
"shriek",
"shrill",
"shrimp",
"shrink",
"shtar",
"sight",
"silence",
"silent",
"silvery",
"simple",
"since",
"single",
"sister",
"slain",
"slate",
"sleep",
"sleepy",
"slice",
"slightest",
"slithy",
"slower",
"small",
"smallest",
"smile",
"smoke",
"smooth",
"snail",
"snatch",
"sneeze",
"snore",
"snout",
"soldier",
"solemn",
"solicit",
"solicitation",
"solid",
"somebody",
"somehow",
"someone",
"somersault",
"somewhere",
"sooner",
"sorrowful",
"sorry",
"sound",
"speak",
"specific",
"speech",
"spell",
"spent",
"spite",
"spoil",
"spoke",
"spoken",
"spoon",
"sprang",
"spread",
"sprinkle",
"square",
"squeak",
"squeeze",
"stalk",
"stamp",
"stand",
"start",
"state",
"steady",
"stick",
"stiff",
"still",
"stingy",
"stole",
"stood",
"stool",
"stoop",
"stormy",
"story",
"straight",
"strange",
"stream",
"strike",
"stroke",
"strong",
"struck",
"stuff",
"stupid",
"stupidest",
"subject",
"submit",
"subscribe",
"sudden",
"suety",
"sugar",
"sulky",
"summer",
"sunny",
"supple",
"support",
"suppose",
"surprise",
"survey",
"survive",
"swallow",
"swamp",
"sweet",
"swept",
"sword",
"table",
"taken",
"taller",
"taste",
"taught",
"teach",
"teacup",
"tease",
"telescope",
"temper",
"thank",
"their",
"thence",
"there",
"these",
"thick",
"think",
"thinner",
"thirsty",
"thirty",
"thistle",
"thorny",
"those",
"though",
"thought",
"thoughtful",
"thousand",
"three",
"threw",
"throne",
"through",
"throughout",
"throw",
"thrown",
"thunder",
"thunderstorm",
"tight",
"timid",
"tipple"];
