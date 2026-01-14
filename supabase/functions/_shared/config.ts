// ================================================================
// PureMark Edge Functions - Configuration Data
// Embedded JSON configs for halal/kosher/allergen detection
// ================================================================

// E-Numbers Configuration - Comprehensive 400+ E-number database
export const E_NUMBERS_CONFIG = {
  always_haram: {
    // Insect-derived
    "120": { name: "Carmine/Cochineal", reason: "Insect-derived colorant (from cochineal beetles)", reason_code: "e120_carmine_cochineal_haram" },
    "904": { name: "Shellac", reason: "Insect-derived glaze (from lac beetles)", reason_code: "e904_shellac_insect_haram" },
    // Bone-derived
    "542": { name: "Bone Phosphate", reason: "Derived from animal bones", reason_code: "e542_bone_phosphate_haram" },
    // Strictly animal (no halal alternative commonly available)
    "901": { name: "Beeswax White/Yellow", reason: "Insect-derived (strict interpretation)", reason_code: "e901_beeswax_insect" },
    "913": { name: "Lanolin", reason: "Derived from sheep wool grease (debated, treated as haram in strict mode)", reason_code: "e913_lanolin_animal_haram" }
  },
  source_dependent: {
    // Glycerol/Glycerin family
    "422": { name: "Glycerol/Glycerin", reason: "Can be animal, plant, or synthetic derived", reason_code: "e422_glycerol_source_unknown" },
    // Stearate/Polysorbate family (E430-E436)
    "430": { name: "Polyoxyethylene (8) stearate", reason: "Stearate may be animal-derived", reason_code: "e430_stearate_source_unknown" },
    "431": { name: "Polyoxyethylene (40) stearate", reason: "Stearate may be animal-derived", reason_code: "e431_stearate_source_unknown" },
    "432": { name: "Polysorbate 20", reason: "Fatty acid esters may be animal-derived", reason_code: "e432_polysorbate_source_unknown" },
    "433": { name: "Polysorbate 80", reason: "Fatty acid esters may be animal-derived", reason_code: "e433_polysorbate_source_unknown" },
    "434": { name: "Polysorbate 40", reason: "Fatty acid esters may be animal-derived", reason_code: "e434_polysorbate_source_unknown" },
    "435": { name: "Polysorbate 60", reason: "Fatty acid esters may be animal-derived", reason_code: "e435_polysorbate_source_unknown" },
    "436": { name: "Polysorbate 65", reason: "Fatty acid esters may be animal-derived", reason_code: "e436_polysorbate_source_unknown" },
    // Gelatin
    "441": { name: "Gelatin", reason: "Animal-derived, source (porcine/bovine/fish) unknown", reason_code: "e441_gelatin_source_unknown" },
    // Fatty acids and glycerides (E470-E479)
    "470a": { name: "Sodium/Potassium/Calcium Salts of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e470a_fatty_acid_salts_source_unknown" },
    "470b": { name: "Magnesium Salts of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e470b_fatty_acid_salts_source_unknown" },
    "470": { name: "Fatty Acid Salts", reason: "Fatty acids may be animal-derived", reason_code: "e470_fatty_acid_salts_source_unknown" },
    "471": { name: "Mono- and Diglycerides", reason: "Glycerides may be animal-derived", reason_code: "e471_mono_diglycerides_source_unknown" },
    "472a": { name: "Acetic Acid Esters", reason: "Fatty acid esters may be animal-derived", reason_code: "e472a_acetic_esters_source_unknown" },
    "472b": { name: "Lactic Acid Esters", reason: "Fatty acid esters may be animal-derived", reason_code: "e472b_lactic_esters_source_unknown" },
    "472c": { name: "Citric Acid Esters", reason: "Fatty acid esters may be animal-derived", reason_code: "e472c_citric_esters_source_unknown" },
    "472d": { name: "Tartaric Acid Esters", reason: "Fatty acid esters may be animal-derived", reason_code: "e472d_tartaric_esters_source_unknown" },
    "472e": { name: "DATEM", reason: "Fatty acid esters may be animal-derived", reason_code: "e472e_datem_source_unknown" },
    "472f": { name: "Mixed Acetic/Tartaric Esters", reason: "Fatty acid esters may be animal-derived", reason_code: "e472f_mixed_esters_source_unknown" },
    "472": { name: "Fatty Acid Esters", reason: "Fatty acid esters may be animal-derived", reason_code: "e472_fatty_acid_esters_source_unknown" },
    "473": { name: "Sucrose Esters of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e473_sucrose_esters_source_unknown" },
    "474": { name: "Sucroglycerides", reason: "Glycerides may be animal-derived", reason_code: "e474_sucroglycerides_source_unknown" },
    "475": { name: "Polyglycerol Esters of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e475_polyglycerol_esters_source_unknown" },
    "476": { name: "Polyglycerol Polyricinoleate", reason: "May contain animal-derived components", reason_code: "e476_pgpr_source_unknown" },
    "477": { name: "Propane-1,2-diol Esters of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e477_propanediol_esters_source_unknown" },
    "478": { name: "Lactylated Fatty Acid Esters of Glycerol and Propane-1,2-diol", reason: "Fatty acids may be animal-derived", reason_code: "e478_lactylated_esters_source_unknown" },
    "479b": { name: "Thermally Oxidized Soya Bean Oil", reason: "May be processed with animal catalysts", reason_code: "e479b_oxidized_soy_source_unknown" },
    // Stearoyl lactylates (E481-E483)
    "481": { name: "Sodium Stearoyl Lactylate", reason: "Stearate may be animal-derived", reason_code: "e481_sodium_stearoyl_lactylate_source_unknown" },
    "482": { name: "Calcium Stearoyl Lactylate", reason: "Stearate may be animal-derived", reason_code: "e482_calcium_stearoyl_lactylate_source_unknown" },
    "483": { name: "Stearyl Tartrate", reason: "Stearate may be animal-derived", reason_code: "e483_stearyl_tartrate_source_unknown" },
    // Sorbitan esters (E491-E496)
    "491": { name: "Sorbitan Monostearate", reason: "Stearate may be animal-derived", reason_code: "e491_sorbitan_monostearate_source_unknown" },
    "492": { name: "Sorbitan Tristearate", reason: "Stearate may be animal-derived", reason_code: "e492_sorbitan_tristearate_source_unknown" },
    "493": { name: "Sorbitan Monolaurate", reason: "Fatty acids may be animal-derived", reason_code: "e493_sorbitan_monolaurate_source_unknown" },
    "494": { name: "Sorbitan Monooleate", reason: "Fatty acids may be animal-derived", reason_code: "e494_sorbitan_monooleate_source_unknown" },
    "495": { name: "Sorbitan Monopalmitate", reason: "Fatty acids may be animal-derived", reason_code: "e495_sorbitan_monopalmitate_source_unknown" },
    // Stearic acid and derivatives (E570-E572)
    "570": { name: "Stearic Acid", reason: "Can be animal or plant-derived", reason_code: "e570_stearic_acid_source_unknown" },
    "571": { name: "Ammonium Stearate", reason: "Stearate may be animal-derived", reason_code: "e571_ammonium_stearate_source_unknown" },
    "572": { name: "Magnesium Stearate", reason: "Stearate may be animal-derived", reason_code: "e572_magnesium_stearate_source_unknown" },
    "573": { name: "Aluminium Stearate", reason: "Stearate may be animal-derived", reason_code: "e573_aluminium_stearate_source_unknown" },
    "574": { name: "Gluconic Acid", reason: "May be fermented on animal-derived media", reason_code: "e574_gluconic_acid_source_unknown" },
    "575": { name: "Glucono Delta-Lactone", reason: "May be fermented on animal-derived media", reason_code: "e575_gdl_source_unknown" },
    "576": { name: "Sodium Gluconate", reason: "May be fermented on animal-derived media", reason_code: "e576_sodium_gluconate_source_unknown" },
    "577": { name: "Potassium Gluconate", reason: "May be fermented on animal-derived media", reason_code: "e577_potassium_gluconate_source_unknown" },
    "578": { name: "Calcium Gluconate", reason: "May be fermented on animal-derived media", reason_code: "e578_calcium_gluconate_source_unknown" },
    "579": { name: "Ferrous Gluconate", reason: "May be fermented on animal-derived media", reason_code: "e579_ferrous_gluconate_source_unknown" },
    // Flavor enhancers (E620-E650)
    "620": { name: "Glutamic Acid", reason: "May be animal-derived or fermented on animal media", reason_code: "e620_glutamic_acid_source_unknown" },
    "621": { name: "Monosodium Glutamate (MSG)", reason: "May be fermented on animal-derived media", reason_code: "e621_msg_source_unknown" },
    "622": { name: "Monopotassium Glutamate", reason: "May be fermented on animal-derived media", reason_code: "e622_mpg_source_unknown" },
    "623": { name: "Calcium Diglutamate", reason: "May be fermented on animal-derived media", reason_code: "e623_calcium_glutamate_source_unknown" },
    "624": { name: "Monoammonium Glutamate", reason: "May be fermented on animal-derived media", reason_code: "e624_ammonium_glutamate_source_unknown" },
    "625": { name: "Magnesium Diglutamate", reason: "May be fermented on animal-derived media", reason_code: "e625_magnesium_glutamate_source_unknown" },
    "626": { name: "Guanylic Acid", reason: "Often derived from fish or yeast", reason_code: "e626_guanylic_acid_source_unknown" },
    "627": { name: "Disodium Guanylate", reason: "Often derived from fish or yeast", reason_code: "e627_disodium_guanylate_source_unknown" },
    "628": { name: "Dipotassium Guanylate", reason: "Often derived from fish or yeast", reason_code: "e628_dipotassium_guanylate_source_unknown" },
    "629": { name: "Calcium Guanylate", reason: "Often derived from fish or yeast", reason_code: "e629_calcium_guanylate_source_unknown" },
    "630": { name: "Inosinic Acid", reason: "Often derived from meat or fish", reason_code: "e630_inosinic_acid_source_unknown" },
    "631": { name: "Disodium Inosinate", reason: "Often derived from meat or fish", reason_code: "e631_disodium_inosinate_source_unknown" },
    "632": { name: "Dipotassium Inosinate", reason: "Often derived from meat or fish", reason_code: "e632_dipotassium_inosinate_source_unknown" },
    "633": { name: "Calcium Inosinate", reason: "Often derived from meat or fish", reason_code: "e633_calcium_inosinate_source_unknown" },
    "634": { name: "Calcium 5'-ribonucleotides", reason: "Often derived from meat or fish", reason_code: "e634_calcium_ribonucleotides_source_unknown" },
    "635": { name: "Disodium 5'-ribonucleotides", reason: "Often derived from meat or fish", reason_code: "e635_disodium_ribonucleotides_source_unknown" },
    "636": { name: "Maltol", reason: "May be derived from animal sources", reason_code: "e636_maltol_source_unknown" },
    "637": { name: "Ethyl Maltol", reason: "May be derived from animal sources", reason_code: "e637_ethyl_maltol_source_unknown" },
    "640": { name: "Glycine", reason: "Amino acid, may be animal-derived", reason_code: "e640_glycine_source_unknown" },
    "641": { name: "L-Leucine", reason: "Amino acid, may be animal-derived", reason_code: "e641_leucine_source_unknown" },
    // Amino acids and proteins (E910-E930)
    "910": { name: "L-Cysteine Hydrochloride", reason: "Often from human hair or duck feathers", reason_code: "e910_cysteine_hcl_source_unknown" },
    "920": { name: "L-Cysteine", reason: "Often derived from human hair, animal feathers, or hooves", reason_code: "e920_lcysteine_source_unknown" },
    "921": { name: "L-Cystine", reason: "Often derived from human hair, animal feathers, or hooves", reason_code: "e921_lcystine_source_unknown" },
    "927a": { name: "Azodicarbonamide", reason: "May be processed with animal-derived components", reason_code: "e927a_azodicarbonamide_source_unknown" },
    // Waxes and glazing agents
    "905a": { name: "Mineral Oil, Food Grade", reason: "Processing may involve animal products", reason_code: "e905a_mineral_oil_source_unknown" },
    "905b": { name: "Petrolatum", reason: "Processing may involve animal products", reason_code: "e905b_petrolatum_source_unknown" },
    "905c": { name: "Petroleum Wax", reason: "Processing may involve animal products", reason_code: "e905c_petroleum_wax_source_unknown" },
    "906": { name: "Benzoin Gum", reason: "May contain animal derivatives", reason_code: "e906_benzoin_source_unknown" },
    "907": { name: "Crystalline Wax", reason: "May be derived from animal sources", reason_code: "e907_crystalline_wax_source_unknown" },
    "908": { name: "Rice Bran Wax", reason: "Processing may involve animal products", reason_code: "e908_rice_bran_wax_source_unknown" },
    // Additional source-dependent additives
    "1000": { name: "Cholic Acid", reason: "Derived from bile (animal source)", reason_code: "e1000_cholic_acid_source_unknown" },
    "1001": { name: "Choline Salts and Esters", reason: "May be animal-derived", reason_code: "e1001_choline_source_unknown" },
    "1104": { name: "Lipases", reason: "Enzyme, may be animal-derived", reason_code: "e1104_lipases_source_unknown" },
    "1105": { name: "Lysozyme", reason: "Usually derived from egg whites", reason_code: "e1105_lysozyme_source_unknown" }
  },
  halal: {
    // E100-E109: Yellow colorants
    "100": { name: "Curcumin", reason: "Plant-derived (turmeric)" },
    "101": { name: "Riboflavin (Vitamin B2)", reason: "Synthetic or plant-derived" },
    "101a": { name: "Riboflavin-5'-phosphate", reason: "Synthetic" },
    "102": { name: "Tartrazine", reason: "Synthetic azo dye" },
    "103": { name: "Chrysoine Resorcinol", reason: "Synthetic azo dye" },
    "104": { name: "Quinoline Yellow", reason: "Synthetic dye" },
    "105": { name: "Fast Yellow AB", reason: "Synthetic azo dye" },
    "106": { name: "Riboflavin-5-sodium phosphate", reason: "Synthetic" },
    "107": { name: "Yellow 2G", reason: "Synthetic azo dye" },
    // E110-E119: Orange colorants
    "110": { name: "Sunset Yellow FCF", reason: "Synthetic azo dye" },
    // E120 is in always_haram (Carmine)
    "121": { name: "Citrus Red 2", reason: "Synthetic dye" },
    "122": { name: "Azorubine/Carmoisine", reason: "Synthetic azo dye" },
    "123": { name: "Amaranth", reason: "Synthetic azo dye" },
    "124": { name: "Ponceau 4R", reason: "Synthetic azo dye" },
    "125": { name: "Scarlet GN", reason: "Synthetic azo dye" },
    "126": { name: "Ponceau 6R", reason: "Synthetic azo dye" },
    "127": { name: "Erythrosine", reason: "Synthetic dye" },
    "128": { name: "Red 2G", reason: "Synthetic azo dye" },
    "129": { name: "Allura Red AC", reason: "Synthetic azo dye" },
    // E130-E139: Blue colorants
    "130": { name: "Indanthrene Blue RS", reason: "Synthetic dye" },
    "131": { name: "Patent Blue V", reason: "Synthetic dye" },
    "132": { name: "Indigotine/Indigo Carmine", reason: "Synthetic dye" },
    "133": { name: "Brilliant Blue FCF", reason: "Synthetic dye" },
    // E140-E149: Green colorants
    "140": { name: "Chlorophylls", reason: "Plant-derived (green plants)" },
    "141": { name: "Copper Chlorophylls", reason: "Plant-derived with copper" },
    "142": { name: "Green S", reason: "Synthetic dye" },
    "143": { name: "Fast Green FCF", reason: "Synthetic dye" },
    // E150-E159: Brown/Black colorants
    "150a": { name: "Plain Caramel", reason: "Plant-derived (sugar)" },
    "150b": { name: "Caustic Sulphite Caramel", reason: "Plant-derived (sugar)" },
    "150c": { name: "Ammonia Caramel", reason: "Plant-derived (sugar)" },
    "150d": { name: "Sulphite Ammonia Caramel", reason: "Plant-derived (sugar)" },
    "151": { name: "Brilliant Black BN", reason: "Synthetic dye" },
    "152": { name: "Black 7984", reason: "Synthetic dye" },
    "153": { name: "Carbon Black/Vegetable Carbon", reason: "Plant-derived" },
    "154": { name: "Brown FK", reason: "Synthetic dye" },
    "155": { name: "Brown HT", reason: "Synthetic azo dye" },
    // E160-E169: Carotenoids and other natural colorants
    "160": { name: "Carotenoids", reason: "Plant-derived colorants" },
    "160a": { name: "Alpha-carotene/Beta-carotene/Gamma-carotene", reason: "Plant-derived" },
    "160b": { name: "Annatto/Bixin/Norbixin", reason: "Plant-derived (annatto seeds)" },
    "160c": { name: "Paprika Extract/Capsanthin/Capsorubin", reason: "Plant-derived (peppers)" },
    "160d": { name: "Lycopene", reason: "Plant-derived (tomatoes)" },
    "160e": { name: "Beta-apo-8'-carotenal", reason: "Synthetic or plant-derived" },
    "160f": { name: "Ethyl Ester of Beta-apo-8'-carotenic Acid", reason: "Synthetic" },
    "161": { name: "Xanthophylls", reason: "Plant-derived" },
    "161a": { name: "Flavoxanthin", reason: "Plant-derived" },
    "161b": { name: "Lutein", reason: "Plant-derived" },
    "161c": { name: "Cryptoxanthin", reason: "Plant-derived" },
    "161d": { name: "Rubixanthin", reason: "Plant-derived" },
    "161e": { name: "Violaxanthin", reason: "Plant-derived" },
    "161f": { name: "Rhodoxanthin", reason: "Plant-derived" },
    "161g": { name: "Canthaxanthin", reason: "Synthetic or algae-derived" },
    "162": { name: "Beetroot Red/Betanin", reason: "Plant-derived (beetroot)" },
    "163": { name: "Anthocyanins", reason: "Plant-derived (grape skins, berries)" },
    "164": { name: "Saffron", reason: "Plant-derived (saffron crocus)" },
    // E170-E179: Mineral colorants
    "170": { name: "Calcium Carbonate/Chalk", reason: "Mineral-derived" },
    "171": { name: "Titanium Dioxide", reason: "Mineral-derived" },
    "172": { name: "Iron Oxides and Hydroxides", reason: "Mineral-derived" },
    "173": { name: "Aluminium", reason: "Mineral-derived" },
    "174": { name: "Silver", reason: "Mineral-derived" },
    "175": { name: "Gold", reason: "Mineral-derived" },
    "176": { name: "Litholrubine BK", reason: "Synthetic dye" },
    "177": { name: "Calcium Carbonate", reason: "Mineral-derived" },
    "178": { name: "Calcium Carbonate", reason: "Mineral-derived" },
    "179": { name: "Pigment Rubine", reason: "Synthetic dye" },
    "180": { name: "Litholrubine BK", reason: "Synthetic dye" },
    "181": { name: "Tannic Acid", reason: "Plant-derived" },
    "182": { name: "Orchil", reason: "Plant-derived (lichen)" },
    // E200-E299: Preservatives
    "200": { name: "Sorbic Acid", reason: "Synthetic preservative" },
    "201": { name: "Sodium Sorbate", reason: "Synthetic preservative" },
    "202": { name: "Potassium Sorbate", reason: "Synthetic preservative" },
    "203": { name: "Calcium Sorbate", reason: "Synthetic preservative" },
    "210": { name: "Benzoic Acid", reason: "Synthetic preservative" },
    "211": { name: "Sodium Benzoate", reason: "Synthetic preservative" },
    "212": { name: "Potassium Benzoate", reason: "Synthetic preservative" },
    "213": { name: "Calcium Benzoate", reason: "Synthetic preservative" },
    "214": { name: "Ethyl Para-hydroxybenzoate (Ethylparaben)", reason: "Synthetic preservative" },
    "215": { name: "Sodium Ethyl Para-hydroxybenzoate", reason: "Synthetic preservative" },
    "216": { name: "Propyl Para-hydroxybenzoate (Propylparaben)", reason: "Synthetic preservative" },
    "217": { name: "Sodium Propyl Para-hydroxybenzoate", reason: "Synthetic preservative" },
    "218": { name: "Methyl Para-hydroxybenzoate (Methylparaben)", reason: "Synthetic preservative" },
    "219": { name: "Sodium Methyl Para-hydroxybenzoate", reason: "Synthetic preservative" },
    "220": { name: "Sulphur Dioxide", reason: "Mineral-derived gas" },
    "221": { name: "Sodium Sulphite", reason: "Mineral-derived" },
    "222": { name: "Sodium Hydrogen Sulphite", reason: "Mineral-derived" },
    "223": { name: "Sodium Metabisulphite", reason: "Mineral-derived" },
    "224": { name: "Potassium Metabisulphite", reason: "Mineral-derived" },
    "225": { name: "Potassium Sulphite", reason: "Mineral-derived" },
    "226": { name: "Calcium Sulphite", reason: "Mineral-derived" },
    "227": { name: "Calcium Hydrogen Sulphite", reason: "Mineral-derived" },
    "228": { name: "Potassium Hydrogen Sulphite", reason: "Mineral-derived" },
    "230": { name: "Biphenyl/Diphenyl", reason: "Synthetic preservative" },
    "231": { name: "Ortho-phenylphenol", reason: "Synthetic preservative" },
    "232": { name: "Sodium Ortho-phenylphenol", reason: "Synthetic preservative" },
    "233": { name: "Thiabendazole", reason: "Synthetic preservative" },
    "234": { name: "Nisin", reason: "Bacteriocin from bacterial fermentation" },
    "235": { name: "Natamycin/Pimaricin", reason: "Antifungal from bacterial fermentation" },
    "236": { name: "Formic Acid", reason: "Synthetic preservative" },
    "237": { name: "Sodium Formate", reason: "Synthetic preservative" },
    "238": { name: "Calcium Formate", reason: "Synthetic preservative" },
    "239": { name: "Hexamethylene Tetramine", reason: "Synthetic preservative" },
    "240": { name: "Formaldehyde", reason: "Synthetic preservative" },
    "242": { name: "Dimethyl Dicarbonate", reason: "Synthetic preservative" },
    "243": { name: "Ethyl Lauroyl Arginate", reason: "Synthetic preservative" },
    "249": { name: "Potassium Nitrite", reason: "Mineral-derived preservative" },
    "250": { name: "Sodium Nitrite", reason: "Mineral-derived preservative" },
    "251": { name: "Sodium Nitrate", reason: "Mineral-derived preservative" },
    "252": { name: "Potassium Nitrate", reason: "Mineral-derived preservative" },
    "260": { name: "Acetic Acid", reason: "Fermentation product or synthetic" },
    "261": { name: "Potassium Acetate", reason: "Synthetic" },
    "262": { name: "Sodium Acetates", reason: "Synthetic" },
    "263": { name: "Calcium Acetate", reason: "Synthetic" },
    "264": { name: "Ammonium Acetate", reason: "Synthetic" },
    "265": { name: "Dehydroacetic Acid", reason: "Synthetic preservative" },
    "266": { name: "Sodium Dehydroacetate", reason: "Synthetic preservative" },
    "270": { name: "Lactic Acid", reason: "Fermentation product (usually plant-based)" },
    "280": { name: "Propionic Acid", reason: "Synthetic or fermentation" },
    "281": { name: "Sodium Propionate", reason: "Synthetic" },
    "282": { name: "Calcium Propionate", reason: "Synthetic" },
    "283": { name: "Potassium Propionate", reason: "Synthetic" },
    "284": { name: "Boric Acid", reason: "Mineral-derived" },
    "285": { name: "Sodium Tetraborate (Borax)", reason: "Mineral-derived" },
    "290": { name: "Carbon Dioxide", reason: "Gas" },
    "296": { name: "Malic Acid", reason: "Plant-derived or synthetic" },
    "297": { name: "Fumaric Acid", reason: "Synthetic or plant-derived" },
    // E300-E399: Antioxidants & Acidity Regulators
    "300": { name: "Ascorbic Acid (Vitamin C)", reason: "Synthetic or plant-derived" },
    "301": { name: "Sodium Ascorbate", reason: "Synthetic" },
    "302": { name: "Calcium Ascorbate", reason: "Synthetic" },
    "303": { name: "Potassium Ascorbate", reason: "Synthetic" },
    "304": { name: "Ascorbyl Palmitate", reason: "Synthetic" },
    "305": { name: "Ascorbyl Stearate", reason: "Synthetic" },
    "306": { name: "Tocopherols (Vitamin E)", reason: "Plant-derived (vegetable oils)" },
    "307": { name: "Alpha-tocopherol", reason: "Plant-derived or synthetic" },
    "308": { name: "Gamma-tocopherol", reason: "Plant-derived" },
    "309": { name: "Delta-tocopherol", reason: "Plant-derived" },
    "310": { name: "Propyl Gallate", reason: "Synthetic antioxidant" },
    "311": { name: "Octyl Gallate", reason: "Synthetic antioxidant" },
    "312": { name: "Dodecyl Gallate", reason: "Synthetic antioxidant" },
    "313": { name: "Ethyl Gallate", reason: "Synthetic antioxidant" },
    "314": { name: "Guaiac Resin", reason: "Plant-derived" },
    "315": { name: "Erythorbic Acid", reason: "Synthetic" },
    "316": { name: "Sodium Erythorbate", reason: "Synthetic" },
    "317": { name: "Erythorbin Acid", reason: "Synthetic" },
    "318": { name: "Calcium Erythorbate", reason: "Synthetic" },
    "319": { name: "TBHQ (tert-Butylhydroquinone)", reason: "Synthetic antioxidant" },
    "320": { name: "BHA (Butylated Hydroxyanisole)", reason: "Synthetic antioxidant" },
    "321": { name: "BHT (Butylated Hydroxytoluene)", reason: "Synthetic antioxidant" },
    "322": { name: "Lecithin", reason: "Source varies (soy, sunflower, egg) - handled separately" },
    "323": { name: "Anoxomer", reason: "Synthetic antioxidant" },
    "324": { name: "Ethoxyquin", reason: "Synthetic antioxidant" },
    "325": { name: "Sodium Lactate", reason: "Derived from lactic acid" },
    "326": { name: "Potassium Lactate", reason: "Derived from lactic acid" },
    "327": { name: "Calcium Lactate", reason: "Derived from lactic acid" },
    "328": { name: "Ammonium Lactate", reason: "Derived from lactic acid" },
    "329": { name: "Magnesium Lactate", reason: "Derived from lactic acid" },
    "330": { name: "Citric Acid", reason: "Fermentation product or synthetic" },
    "331": { name: "Sodium Citrates", reason: "Derived from citric acid" },
    "332": { name: "Potassium Citrates", reason: "Derived from citric acid" },
    "333": { name: "Calcium Citrates", reason: "Derived from citric acid" },
    "334": { name: "Tartaric Acid", reason: "Plant-derived (grape byproduct)" },
    "335": { name: "Sodium Tartrates", reason: "Derived from tartaric acid" },
    "336": { name: "Potassium Tartrates (Cream of Tartar)", reason: "Plant-derived (grape byproduct)" },
    "337": { name: "Sodium Potassium Tartrate", reason: "Derived from tartaric acid" },
    "338": { name: "Phosphoric Acid", reason: "Mineral-derived" },
    "339": { name: "Sodium Phosphates", reason: "Mineral-derived" },
    "340": { name: "Potassium Phosphates", reason: "Mineral-derived" },
    "341": { name: "Calcium Phosphates", reason: "Mineral-derived" },
    "342": { name: "Ammonium Phosphates", reason: "Mineral-derived" },
    "343": { name: "Magnesium Phosphates", reason: "Mineral-derived" },
    "344": { name: "Lecithin Citrate", reason: "Derived from lecithin and citric acid" },
    "345": { name: "Magnesium Citrate", reason: "Mineral-derived" },
    "349": { name: "Ammonium Malate", reason: "Derived from malic acid" },
    "350": { name: "Sodium Malates", reason: "Derived from malic acid" },
    "351": { name: "Potassium Malate", reason: "Derived from malic acid" },
    "352": { name: "Calcium Malates", reason: "Derived from malic acid" },
    "353": { name: "Metatartaric Acid", reason: "Derived from tartaric acid" },
    "354": { name: "Calcium Tartrate", reason: "Derived from tartaric acid" },
    "355": { name: "Adipic Acid", reason: "Synthetic" },
    "356": { name: "Sodium Adipate", reason: "Synthetic" },
    "357": { name: "Potassium Adipate", reason: "Synthetic" },
    "358": { name: "Calcium Adipate", reason: "Synthetic" },
    "359": { name: "Ammonium Adipate", reason: "Synthetic" },
    "363": { name: "Succinic Acid", reason: "Synthetic or fermentation" },
    "364": { name: "Sodium Succinate", reason: "Synthetic" },
    "365": { name: "Sodium Fumarate", reason: "Synthetic" },
    "366": { name: "Potassium Fumarate", reason: "Synthetic" },
    "367": { name: "Calcium Fumarate", reason: "Synthetic" },
    "368": { name: "Ammonium Fumarate", reason: "Synthetic" },
    "370": { name: "1,4-Heptonolactone", reason: "Synthetic" },
    "375": { name: "Nicotinic Acid (Niacin)", reason: "Synthetic vitamin" },
    "380": { name: "Triammonium Citrate", reason: "Derived from citric acid" },
    "381": { name: "Ammonium Ferric Citrate", reason: "Mineral-derived" },
    "383": { name: "Calcium Glycerophosphate", reason: "Mineral-derived" },
    "384": { name: "Isopropyl Citrate", reason: "Synthetic" },
    "385": { name: "Calcium Disodium EDTA", reason: "Synthetic chelating agent" },
    "386": { name: "Disodium EDTA", reason: "Synthetic chelating agent" },
    "387": { name: "Oxystearin", reason: "Synthetic" },
    "388": { name: "Thiodipropionic Acid", reason: "Synthetic" },
    "389": { name: "Dilauryl Thiodipropionate", reason: "Synthetic" },
    "390": { name: "Distearyl Thiodipropionate", reason: "Synthetic" },
    "391": { name: "Phytic Acid", reason: "Plant-derived (seeds)" },
    "392": { name: "Rosemary Extract", reason: "Plant-derived" },
    // E400-E499: Thickeners, Stabilizers, Emulsifiers
    "400": { name: "Alginic Acid", reason: "Plant-derived (seaweed)" },
    "401": { name: "Sodium Alginate", reason: "Plant-derived (seaweed)" },
    "402": { name: "Potassium Alginate", reason: "Plant-derived (seaweed)" },
    "403": { name: "Ammonium Alginate", reason: "Plant-derived (seaweed)" },
    "404": { name: "Calcium Alginate", reason: "Plant-derived (seaweed)" },
    "405": { name: "Propan-1,2-diol Alginate", reason: "Plant-derived (seaweed)" },
    "406": { name: "Agar", reason: "Plant-derived (seaweed)" },
    "407": { name: "Carrageenan", reason: "Plant-derived (seaweed)" },
    "407a": { name: "Processed Eucheuma Seaweed", reason: "Plant-derived (seaweed)" },
    "408": { name: "Furcelleran", reason: "Plant-derived (seaweed)" },
    "409": { name: "Arabinogalactan", reason: "Plant-derived (larch trees)" },
    "410": { name: "Locust Bean Gum/Carob Gum", reason: "Plant-derived (carob seeds)" },
    "411": { name: "Oat Gum", reason: "Plant-derived" },
    "412": { name: "Guar Gum", reason: "Plant-derived (guar beans)" },
    "413": { name: "Tragacanth", reason: "Plant-derived (shrubs)" },
    "414": { name: "Gum Arabic/Acacia Gum", reason: "Plant-derived (acacia trees)" },
    "415": { name: "Xanthan Gum", reason: "Fermentation product" },
    "416": { name: "Karaya Gum", reason: "Plant-derived (sterculia trees)" },
    "417": { name: "Tara Gum", reason: "Plant-derived (tara shrub seeds)" },
    "418": { name: "Gellan Gum", reason: "Fermentation product" },
    "419": { name: "Gum Ghatti", reason: "Plant-derived (anogeissus trees)" },
    "420": { name: "Sorbitol", reason: "Plant-derived (corn, berries)" },
    "421": { name: "Mannitol", reason: "Plant-derived (seaweed)" },
    "422a": { name: "Vegetable Glycerol", reason: "Plant-derived" },
    "425": { name: "Konjac", reason: "Plant-derived (konjac plant)" },
    "426": { name: "Soybean Hemicellulose", reason: "Plant-derived" },
    "427": { name: "Cassia Gum", reason: "Plant-derived (cassia seeds)" },
    "428": { name: "Gelatin (Fish)", reason: "Fish-derived - halal" },
    "429": { name: "Peptones", reason: "Plant-derived proteins" },
    "440": { name: "Pectin", reason: "Plant-derived (fruit)" },
    "440a": { name: "Pectin", reason: "Plant-derived (fruit)" },
    "440b": { name: "Amidated Pectin", reason: "Plant-derived (fruit)" },
    "442": { name: "Ammonium Phosphatides", reason: "Plant-derived" },
    "444": { name: "Sucrose Acetate Isobutyrate", reason: "Plant-derived (sugar)" },
    "445": { name: "Glycerol Esters of Wood Rosin", reason: "Plant-derived" },
    "450": { name: "Diphosphates", reason: "Mineral-derived" },
    "451": { name: "Triphosphates", reason: "Mineral-derived" },
    "452": { name: "Polyphosphates", reason: "Mineral-derived" },
    "459": { name: "Beta-cyclodextrin", reason: "Plant-derived (starch)" },
    "460": { name: "Cellulose", reason: "Plant-derived" },
    "460a": { name: "Microcrystalline Cellulose", reason: "Plant-derived" },
    "460b": { name: "Powdered Cellulose", reason: "Plant-derived" },
    "461": { name: "Methyl Cellulose", reason: "Plant-derived" },
    "462": { name: "Ethyl Cellulose", reason: "Plant-derived" },
    "463": { name: "Hydroxypropyl Cellulose", reason: "Plant-derived" },
    "464": { name: "Hydroxypropyl Methyl Cellulose", reason: "Plant-derived" },
    "465": { name: "Ethyl Methyl Cellulose", reason: "Plant-derived" },
    "466": { name: "Carboxymethyl Cellulose", reason: "Plant-derived" },
    "467": { name: "Ethyl Hydroxyethyl Cellulose", reason: "Plant-derived" },
    "468": { name: "Crosslinked Sodium Carboxymethyl Cellulose", reason: "Plant-derived" },
    "469": { name: "Enzymically Hydrolysed Carboxymethyl Cellulose", reason: "Plant-derived" },
    // E500-E599: Acidity Regulators & Anti-caking
    "500": { name: "Sodium Carbonates", reason: "Mineral-derived" },
    "501": { name: "Potassium Carbonates", reason: "Mineral-derived" },
    "503": { name: "Ammonium Carbonates", reason: "Synthetic" },
    "504": { name: "Magnesium Carbonates", reason: "Mineral-derived" },
    "505": { name: "Ferrous Carbonate", reason: "Mineral-derived" },
    "507": { name: "Hydrochloric Acid", reason: "Mineral-derived" },
    "508": { name: "Potassium Chloride", reason: "Mineral-derived" },
    "509": { name: "Calcium Chloride", reason: "Mineral-derived" },
    "510": { name: "Ammonium Chloride", reason: "Mineral-derived" },
    "511": { name: "Magnesium Chloride", reason: "Mineral-derived" },
    "512": { name: "Stannous Chloride", reason: "Mineral-derived" },
    "513": { name: "Sulphuric Acid", reason: "Mineral-derived" },
    "514": { name: "Sodium Sulphates", reason: "Mineral-derived" },
    "515": { name: "Potassium Sulphates", reason: "Mineral-derived" },
    "516": { name: "Calcium Sulphate", reason: "Mineral-derived" },
    "517": { name: "Ammonium Sulphate", reason: "Mineral-derived" },
    "518": { name: "Magnesium Sulphate", reason: "Mineral-derived" },
    "519": { name: "Cupric Sulphate", reason: "Mineral-derived" },
    "520": { name: "Aluminium Sulphate", reason: "Mineral-derived" },
    "521": { name: "Aluminium Sodium Sulphate", reason: "Mineral-derived" },
    "522": { name: "Aluminium Potassium Sulphate", reason: "Mineral-derived" },
    "523": { name: "Aluminium Ammonium Sulphate", reason: "Mineral-derived" },
    "524": { name: "Sodium Hydroxide", reason: "Mineral-derived" },
    "525": { name: "Potassium Hydroxide", reason: "Mineral-derived" },
    "526": { name: "Calcium Hydroxide", reason: "Mineral-derived" },
    "527": { name: "Ammonium Hydroxide", reason: "Mineral-derived" },
    "528": { name: "Magnesium Hydroxide", reason: "Mineral-derived" },
    "529": { name: "Calcium Oxide", reason: "Mineral-derived" },
    "530": { name: "Magnesium Oxide", reason: "Mineral-derived" },
    "535": { name: "Sodium Ferrocyanide", reason: "Mineral-derived" },
    "536": { name: "Potassium Ferrocyanide", reason: "Mineral-derived" },
    "537": { name: "Ferrous Hexacyanomanganate", reason: "Mineral-derived" },
    "538": { name: "Calcium Ferrocyanide", reason: "Mineral-derived" },
    "539": { name: "Sodium Thiosulphate", reason: "Mineral-derived" },
    "540": { name: "Dicalcium Diphosphate", reason: "Mineral-derived" },
    "541": { name: "Sodium Aluminium Phosphate", reason: "Mineral-derived" },
    "543": { name: "Calcium Sodium Polyphosphate", reason: "Mineral-derived" },
    "544": { name: "Calcium Polyphosphate", reason: "Mineral-derived" },
    "545": { name: "Ammonium Polyphosphate", reason: "Mineral-derived" },
    "550": { name: "Sodium Silicates", reason: "Mineral-derived" },
    "551": { name: "Silicon Dioxide (Silica)", reason: "Mineral-derived" },
    "552": { name: "Calcium Silicate", reason: "Mineral-derived" },
    "553": { name: "Magnesium Silicates/Talc", reason: "Mineral-derived" },
    "554": { name: "Sodium Aluminosilicate", reason: "Mineral-derived" },
    "555": { name: "Potassium Aluminium Silicate", reason: "Mineral-derived" },
    "556": { name: "Calcium Aluminium Silicate", reason: "Mineral-derived" },
    "558": { name: "Bentonite", reason: "Mineral-derived (clay)" },
    "559": { name: "Aluminium Silicate (Kaolin)", reason: "Mineral-derived (clay)" },
    "560": { name: "Potassium Silicate", reason: "Mineral-derived" },
    "570a": { name: "Stearic Acid (Vegetable)", reason: "Plant-derived" },
    // E900-E999: Glazing agents, gases
    "900": { name: "Dimethylpolysiloxane", reason: "Synthetic silicone" },
    "900a": { name: "Polydimethylsiloxane", reason: "Synthetic silicone" },
    "902": { name: "Candelilla Wax", reason: "Plant-derived (candelilla plant)" },
    "903": { name: "Carnauba Wax", reason: "Plant-derived (palm leaves)" },
    // E901, E904, E913 are in always_haram or source_dependent
    "905": { name: "Microcrystalline Wax", reason: "Petroleum-derived" },
    "909": { name: "Spermaceti Wax", reason: "Synthetic version available" },
    "910": { name: "L-Cysteine Wax Esters", reason: "Synthetic" },
    "912": { name: "Montan Acid Esters", reason: "Plant/mineral derived" },
    "914": { name: "Oxidized Polyethylene Wax", reason: "Synthetic" },
    "915": { name: "Esters of Colophony", reason: "Plant-derived (pine resin)" },
    "918": { name: "Nitrogen Oxides", reason: "Synthetic gas" },
    "919": { name: "Nitrous Oxide", reason: "Synthetic gas" },
    "920a": { name: "L-Cysteine (Synthetic)", reason: "Synthetic version - halal" },
    "922": { name: "Potassium Persulphate", reason: "Mineral-derived" },
    "923": { name: "Ammonium Persulphate", reason: "Mineral-derived" },
    "924": { name: "Potassium Bromate", reason: "Mineral-derived" },
    "925": { name: "Chlorine", reason: "Chemical element" },
    "926": { name: "Chlorine Dioxide", reason: "Synthetic" },
    "927b": { name: "Carbamide (Urea)", reason: "Synthetic" },
    "928": { name: "Benzoyl Peroxide", reason: "Synthetic" },
    "929": { name: "Acetone Peroxide", reason: "Synthetic" },
    "930": { name: "Calcium Peroxide", reason: "Mineral-derived" },
    "938": { name: "Argon", reason: "Inert gas" },
    "939": { name: "Helium", reason: "Inert gas" },
    "940": { name: "Dichlorodifluoromethane", reason: "Synthetic" },
    "941": { name: "Nitrogen", reason: "Inert gas" },
    "942": { name: "Nitrous Oxide", reason: "Gas" },
    "943a": { name: "Butane", reason: "Hydrocarbon gas" },
    "943b": { name: "Isobutane", reason: "Hydrocarbon gas" },
    "944": { name: "Propane", reason: "Hydrocarbon gas" },
    "945": { name: "Chloropentafluoroethane", reason: "Synthetic" },
    "946": { name: "Octafluorocyclobutane", reason: "Synthetic" },
    "948": { name: "Oxygen", reason: "Gas element" },
    "949": { name: "Hydrogen", reason: "Gas element" },
    "950": { name: "Acesulfame Potassium", reason: "Synthetic sweetener" },
    "951": { name: "Aspartame", reason: "Synthetic sweetener" },
    "952": { name: "Cyclamate", reason: "Synthetic sweetener" },
    "953": { name: "Isomalt", reason: "Plant-derived (sugar beet)" },
    "954": { name: "Saccharin", reason: "Synthetic sweetener" },
    "955": { name: "Sucralose", reason: "Synthetic sweetener" },
    "956": { name: "Alitame", reason: "Synthetic sweetener" },
    "957": { name: "Thaumatin", reason: "Plant-derived (African fruit)" },
    "958": { name: "Glycyrrhizin", reason: "Plant-derived (licorice root)" },
    "959": { name: "Neohesperidin Dihydrochalcone", reason: "Plant-derived (citrus)" },
    "960": { name: "Steviol Glycosides (Stevia)", reason: "Plant-derived (stevia leaves)" },
    "961": { name: "Neotame", reason: "Synthetic sweetener" },
    "962": { name: "Aspartame-Acesulfame Salt", reason: "Synthetic sweetener" },
    "963": { name: "Maltitol", reason: "Plant-derived (starch)" },
    "964": { name: "Polyglycitol Syrup", reason: "Plant-derived" },
    "965": { name: "Maltitol", reason: "Plant-derived (starch)" },
    "966": { name: "Lactitol", reason: "Plant-derived" },
    "967": { name: "Xylitol", reason: "Plant-derived (birch, corn)" },
    "968": { name: "Erythritol", reason: "Fermentation product" },
    "969": { name: "Advantame", reason: "Synthetic sweetener" },
    // E1000+: Modified starches and other additives
    "1100": { name: "Amylases", reason: "Enzyme from plant or microbial source" },
    "1101": { name: "Proteases", reason: "Enzyme from plant or microbial source" },
    "1102": { name: "Glucose Oxidase", reason: "Enzyme from microbial source" },
    "1103": { name: "Invertases", reason: "Enzyme from yeast" },
    "1200": { name: "Polydextrose", reason: "Synthetic from plant materials" },
    "1201": { name: "Polyvinylpyrrolidone", reason: "Synthetic" },
    "1202": { name: "Polyvinylpolypyrrolidone", reason: "Synthetic" },
    "1203": { name: "Polyvinyl Alcohol", reason: "Synthetic" },
    "1204": { name: "Pullulan", reason: "Fermentation product (fungal)" },
    "1205": { name: "Basic Methacrylate Copolymer", reason: "Synthetic" },
    "1400": { name: "Dextrin", reason: "Plant-derived (starch)" },
    "1401": { name: "Acid-treated Starch", reason: "Plant-derived (starch)" },
    "1402": { name: "Alkaline-treated Starch", reason: "Plant-derived (starch)" },
    "1403": { name: "Bleached Starch", reason: "Plant-derived (starch)" },
    "1404": { name: "Oxidized Starch", reason: "Plant-derived (starch)" },
    "1405": { name: "Enzyme-treated Starch", reason: "Plant-derived (starch)" },
    "1410": { name: "Monostarch Phosphate", reason: "Plant-derived (starch)" },
    "1411": { name: "Distarch Glycerol", reason: "Plant-derived (starch)" },
    "1412": { name: "Distarch Phosphate", reason: "Plant-derived (starch)" },
    "1413": { name: "Phosphated Distarch Phosphate", reason: "Plant-derived (starch)" },
    "1414": { name: "Acetylated Distarch Phosphate", reason: "Plant-derived (starch)" },
    "1420": { name: "Acetylated Starch", reason: "Plant-derived (starch)" },
    "1421": { name: "Acetylated Starch (Adipate)", reason: "Plant-derived (starch)" },
    "1422": { name: "Acetylated Distarch Adipate", reason: "Plant-derived (starch)" },
    "1430": { name: "Distarch Glycerine", reason: "Plant-derived (starch)" },
    "1440": { name: "Hydroxypropyl Starch", reason: "Plant-derived (starch)" },
    "1441": { name: "Hydroxypropyl Distarch Glycerine", reason: "Plant-derived (starch)" },
    "1442": { name: "Hydroxypropyl Distarch Phosphate", reason: "Plant-derived (starch)" },
    "1443": { name: "Hydroxypropyl Distarch Glycerol", reason: "Plant-derived (starch)" },
    "1450": { name: "Starch Sodium Octenyl Succinate", reason: "Plant-derived (starch)" },
    "1451": { name: "Acetylated Oxidised Starch", reason: "Plant-derived (starch)" },
    "1452": { name: "Starch Aluminium Octenyl Succinate", reason: "Plant-derived (starch)" },
    "1500": { name: "Ethanol", reason: "May be halal if from non-grape fermentation" },
    "1503": { name: "Castor Oil", reason: "Plant-derived (castor beans)" },
    "1504": { name: "Ethyl Acetate", reason: "Synthetic" },
    "1505": { name: "Triethyl Citrate", reason: "Synthetic from citric acid" },
    "1510": { name: "Ethanol", reason: "Fermentation product - context dependent" },
    "1517": { name: "Glyceryl Diacetate", reason: "Synthetic" },
    "1518": { name: "Glyceryl Triacetate (Triacetin)", reason: "Synthetic or plant-derived" },
    "1519": { name: "Benzyl Alcohol", reason: "Synthetic" },
    "1520": { name: "Propylene Glycol", reason: "Synthetic" },
    "1521": { name: "Polyethylene Glycol", reason: "Synthetic" }
  }
} as const;

// Alcohol Configuration
export const ALCOHOL_CONFIG = {
  explicit_alcohols: {
    terms: ["alcohol", "ethanol", "ethyl alcohol"],
    reason: "Contains alcohol/ethanol",
    reason_code: "haram_alcohol_detected"
  },
  alcoholic_beverages: {
    terms: [
      "wine", "red wine", "white wine", "cooking wine", "rice wine",
      "beer", "ale", "lager", "stout", "rum", "whisky", "whiskey",
      "vodka", "brandy", "gin", "tequila", "liqueur", "liquor",
      "sake", "mirin", "marsala", "sherry", "port", "port wine",
      "champagne", "vermouth", "cognac", "bourbon", "scotch",
      "absinthe", "kirsch", "kahlua", "amaretto", "grand marnier",
      "cointreau", "triple sec", "cider", "hard cider", "mead"
    ],
    reason: "Alcoholic beverage",
    reason_code: "haram_alcoholic_beverage"
  },
  alcohol_processing: {
    terms: [
      "alcohol extract", "extracted with alcohol", "ethanolic extract",
      "tincture", "in alcohol", "alcohol carrier", "alcohol based",
      "alcohol-based", "deglazed with wine", "flambeed", "flambe",
      "flambeed", "macerated in", "marinated in wine", "wine reduction",
      "beer batter", "rum soaked", "brandy soaked", "wine sauce", "bourbon glaze"
    ],
    reason: "Processed with alcohol",
    reason_code: "haram_alcohol_processing"
  },
  high_risk_extracts: {
    terms: [
      "vanilla extract", "pure vanilla extract", "bourbon vanilla",
      "rum extract", "brandy extract", "wine extract", "almond extract",
      "lemon extract", "orange extract", "peppermint extract",
      "mint extract", "anise extract", "coffee extract"
    ],
    reason: "Extract commonly made with alcohol solvent",
    reason_code: "haram_alcohol_extract"
  },
  halal_alternatives: {
    terms: [
      "vanilla bean", "vanilla beans", "vanilla powder",
      "vanilla bean powder", "ground vanilla", "vanilla paste",
      "alcohol-free vanilla", "halal vanilla", "vanilla flavoring",
      "natural vanilla flavor", "imitation vanilla", "vanillin"
    ],
    reason: "Halal vanilla alternative (no alcohol extraction)",
    reason_code: "halal_vanilla_alternative",
    status: "HALAL"
  },
  low_risk_fermented: {
    terms: [
      "soy sauce", "vinegar", "apple cider vinegar", "balsamic vinegar",
      "rice vinegar", "white vinegar", "miso", "tempeh", "kombucha"
    ],
    reason: "Fermented product - trace alcohol from natural fermentation, generally considered halal",
    reason_code: "fermented_trace_alcohol_halal",
    status: "HALAL"
  }
} as const;

// Animal Derivatives Configuration
export const ANIMAL_DERIVATIVES_CONFIG = {
  always_haram: {
    pork_derivatives: {
      terms: [
        "pork", "porcine", "swine", "pig", "boar", "lard", "ham", "bacon",
        "porcine gelatin", "gelatin (porcine)", "pork fat", "pork extract",
        "pork flavoring", "pancetta", "prosciutto", "chorizo", "pepperoni"
      ],
      reason: "Pork/swine derivative - explicitly forbidden",
      reason_code: "haram_pork_swine_detected"
    },
    blood_products: {
      terms: [
        "blood", "blood plasma", "blood powder", "dried blood",
        "hemoglobin", "blood sausage", "black pudding", "blood meal"
      ],
      reason: "Blood product - explicitly forbidden",
      reason_code: "haram_blood_detected"
    },
    carrion: {
      terms: ["carrion"],
      reason: "Carrion (dead animal not slaughtered) - explicitly forbidden",
      reason_code: "haram_carrion_detected"
    },
    insect_derived: {
      terms: [
        "carmine", "cochineal", "shellac", "confectioner's glaze",
        "pharmaceutical glaze", "lac resin"
      ],
      reason: "Insect-derived ingredient",
      reason_code: "haram_insect_derived"
    }
  },
  source_dependent: {
    gelatin: {
      generic_terms: ["gelatin", "gelatine", "gel"],
      sources: {
        porcine: {
          terms: ["porcine gelatin", "pork gelatin", "pig gelatin"],
          status: "HARAM",
          reason: "Porcine (pig) gelatin"
        },
        bovine: {
          terms: ["bovine gelatin", "beef gelatin", "cow gelatin"],
          status: "MUSHBOOH",
          reason: "Bovine gelatin - requires halal slaughter verification"
        },
        fish: {
          terms: ["fish gelatin", "marine gelatin", "kosher gelatin"],
          status: "HALAL",
          reason: "Fish/marine gelatin - halal"
        },
        halal_certified: {
          terms: ["halal gelatin", "gelatin (halal)", "halal-certified gelatin"],
          status: "HALAL",
          reason: "Halal-certified gelatin"
        },
        plant_based: {
          terms: ["plant gelatin", "vegan gelatin", "vegetable gelatin", "agar", "agar-agar", "carrageenan", "pectin"],
          status: "HALAL",
          reason: "Plant-based gelatin alternative"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Gelatin with unspecified source - could be porcine, bovine, or fish",
      reason_code: "gelatin_source_unknown_mushbooh"
    },
    glycerin: {
      generic_terms: ["glycerin", "glycerine", "glycerol"],
      sources: {
        plant: {
          terms: ["vegetable glycerin", "vegetable glycerine", "plant glycerin", "plant-based glycerin", "vg"],
          status: "HALAL",
          reason: "Plant-based glycerin"
        },
        animal: {
          terms: ["animal glycerin", "tallow glycerin"],
          status: "MUSHBOOH",
          reason: "Animal-derived glycerin - requires halal verification"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Glycerin with unspecified source - could be animal or plant",
      reason_code: "glycerin_source_unknown_mushbooh"
    },
    fatty_acids: {
      generic_terms: [
        "fatty acids", "fatty acid", "stearic acid", "palmitic acid",
        "oleic acid", "mono and diglycerides", "mono-and diglycerides",
        "monoglycerides", "diglycerides", "emulsifier"
      ],
      sources: {
        plant: {
          terms: ["vegetable fatty acids", "plant-based emulsifier", "soy-based", "palm-based"],
          status: "HALAL",
          reason: "Plant-based fatty acids"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Fatty acids/emulsifiers with unspecified source",
      reason_code: "fatty_acids_source_unknown_mushbooh"
    },
    shortening: {
      generic_terms: ["shortening", "tallow"],
      sources: {
        vegetable: {
          terms: ["vegetable shortening", "palm shortening", "coconut shortening"],
          status: "HALAL",
          reason: "Vegetable-based shortening"
        },
        animal: {
          terms: ["animal shortening", "beef tallow", "lard"],
          status: "HARAM",
          reason: "Animal-based shortening (often contains lard)"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Shortening with unspecified source",
      reason_code: "shortening_source_unknown_mushbooh"
    },
    enzymes: {
      generic_terms: ["enzymes", "enzyme"],
      sources: {
        microbial: {
          terms: ["microbial enzymes", "microbial enzyme", "fungal enzymes", "bacterial enzymes"],
          status: "HALAL",
          reason: "Microbial/fungal enzymes - halal"
        },
        animal: {
          terms: ["animal enzymes", "calf enzymes"],
          status: "MUSHBOOH",
          reason: "Animal-derived enzymes - requires halal verification"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Enzymes with unspecified source",
      reason_code: "enzymes_source_unknown_mushbooh"
    },
    rennet: {
      generic_terms: ["rennet"],
      sources: {
        microbial: {
          terms: ["microbial rennet", "vegetable rennet", "fungal rennet", "non-animal rennet"],
          status: "HALAL",
          reason: "Microbial/vegetable rennet - halal"
        },
        animal: {
          terms: ["animal rennet", "calf rennet", "traditional rennet"],
          status: "MUSHBOOH",
          reason: "Animal rennet - requires halal slaughter verification"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Rennet with unspecified source",
      reason_code: "rennet_source_unknown_mushbooh"
    },
    pepsin: {
      generic_terms: ["pepsin"],
      sources: {
        porcine: {
          terms: ["porcine pepsin", "pig pepsin"],
          status: "HARAM",
          reason: "Porcine pepsin"
        },
        microbial: {
          terms: ["microbial pepsin", "fungal pepsin"],
          status: "HALAL",
          reason: "Microbial pepsin - halal"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Pepsin with unspecified source - often porcine",
      reason_code: "pepsin_source_unknown_mushbooh"
    },
    lipase: {
      generic_terms: ["lipase"],
      sources: {
        microbial: {
          terms: ["microbial lipase", "fungal lipase"],
          status: "HALAL",
          reason: "Microbial lipase - halal"
        },
        animal: {
          terms: ["animal lipase", "calf lipase", "kid lipase", "lamb lipase"],
          status: "MUSHBOOH",
          reason: "Animal lipase - requires halal verification"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Lipase with unspecified source",
      reason_code: "lipase_source_unknown_mushbooh"
    },
    collagen: {
      generic_terms: ["collagen"],
      sources: {
        marine: {
          terms: ["marine collagen", "fish collagen"],
          status: "HALAL",
          reason: "Marine/fish collagen - halal"
        },
        bovine: {
          terms: ["bovine collagen", "beef collagen"],
          status: "MUSHBOOH",
          reason: "Bovine collagen - requires halal verification"
        },
        porcine: {
          terms: ["porcine collagen", "pig collagen"],
          status: "HARAM",
          reason: "Porcine collagen"
        },
        plant: {
          terms: ["plant collagen", "vegan collagen"],
          status: "HALAL",
          reason: "Plant-based collagen alternative"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "Collagen with unspecified source",
      reason_code: "collagen_source_unknown_mushbooh"
    },
    vitamin_d3: {
      generic_terms: ["vitamin d3", "cholecalciferol", "d3"],
      sources: {
        lichen: {
          terms: ["lichen vitamin d3", "lichen-derived", "vegan vitamin d3", "plant vitamin d3"],
          status: "HALAL",
          reason: "Lichen-derived vitamin D3 - halal"
        },
        lanolin: {
          terms: ["lanolin vitamin d3", "sheep wool", "wool-derived"],
          status: "HALAL",
          reason: "Lanolin-derived vitamin D3 - halal (wool is halal)"
        },
        fish: {
          terms: ["fish oil vitamin d3", "fish liver oil", "cod liver"],
          status: "HALAL",
          reason: "Fish-derived vitamin D3 - halal"
        }
      },
      default_status: "HALAL",
      default_reason: "Vitamin D3 - typically from lanolin (sheep wool) or fish, both halal",
      reason_code: "vitamin_d3_halal"
    },
    omega3: {
      generic_terms: ["omega-3", "omega 3", "fish oil", "dha", "epa"],
      sources: {
        fish: {
          terms: ["fish oil", "salmon oil", "cod liver oil", "marine omega"],
          status: "HALAL",
          reason: "Fish-derived omega-3 - halal"
        },
        algae: {
          terms: ["algae omega", "algal oil", "algae dha", "vegan omega"],
          status: "HALAL",
          reason: "Algae-derived omega-3 - halal"
        },
        krill: {
          terms: ["krill oil"],
          status: "HALAL",
          reason: "Krill oil - halal (sea creature)"
        }
      },
      default_status: "HALAL",
      default_reason: "Omega-3 - typically from fish or algae, both halal",
      reason_code: "omega3_halal"
    },
    l_cysteine: {
      generic_terms: ["l-cysteine", "lcysteine", "l cysteine", "cysteine"],
      sources: {
        synthetic: {
          terms: ["synthetic l-cysteine", "fermentation l-cysteine"],
          status: "HALAL",
          reason: "Synthetic/fermentation L-cysteine - halal"
        },
        human_hair: {
          terms: ["human hair l-cysteine"],
          status: "HARAM",
          reason: "Human hair-derived L-cysteine - haram"
        },
        duck_feather: {
          terms: ["duck feather", "poultry feather"],
          status: "MUSHBOOH",
          reason: "Poultry feather L-cysteine - requires halal slaughter verification"
        }
      },
      default_status: "MUSHBOOH",
      default_reason: "L-cysteine with unspecified source - often from human hair or duck feathers",
      reason_code: "lcysteine_source_unknown_mushbooh"
    }
  },
  processed_dairy: {
    terms: [
      "cheese", "whey", "whey powder", "whey protein", "casein",
      "caseinate", "sodium caseinate", "calcium caseinate",
      "milk powder", "skim milk powder", "cream powder", "buttermilk powder"
    ],
    halal_qualifiers: ["microbial rennet", "vegetable rennet", "halal cheese", "halal certified"],
    reason: "Processed dairy may contain animal rennet or non-halal cultures",
    reason_code: "processed_dairy_mushbooh",
    default_status: "MUSHBOOH"
  },
  starter_cultures: {
    terms: [
      "cultures", "culture", "starter culture", "starter cultures",
      "lactic cultures", "yogurt cultures", "cheese cultures"
    ],
    reason: "Starter cultures may be grown on non-halal media",
    reason_code: "cultures_source_unknown_mushbooh",
    default_status: "MUSHBOOH"
  },
  other_animal_derived: {
    bone_products: {
      terms: [
        "bone char", "bone charcoal", "bone phosphate", "bone meal",
        "bone broth", "beef broth", "chicken broth"
      ],
      reason: "Bone-derived product - requires halal source verification",
      reason_code: "bone_product_source_unknown",
      default_status: "MUSHBOOH"
    },
    isinglass: {
      terms: ["isinglass"],
      reason: "Fish bladder - halal (used as fining agent in beverages)",
      reason_code: "isinglass_fish_halal",
      default_status: "HALAL"
    },
    keratin: {
      terms: ["keratin", "hydrolyzed keratin"],
      reason: "Keratin from hair/feathers/hooves - source dependent",
      reason_code: "keratin_source_unknown_mushbooh",
      default_status: "MUSHBOOH"
    },
    elastin: {
      terms: ["elastin"],
      reason: "Elastin from animal connective tissue - source dependent",
      reason_code: "elastin_source_unknown_mushbooh",
      default_status: "MUSHBOOH"
    },
    chitosan: {
      terms: ["chitosan", "chitin"],
      reason: "Chitosan from shellfish shells - halal for most",
      reason_code: "chitosan_shellfish",
      default_status: "HALAL"
    },
    lanolin: {
      terms: ["lanolin", "wool wax", "wool grease"],
      reason: "Lanolin from sheep wool - halal (no slaughter involved)",
      reason_code: "lanolin_halal",
      default_status: "HALAL"
    },
    beeswax: {
      terms: ["beeswax", "cera alba"],
      reason: "Beeswax - halal",
      reason_code: "beeswax_halal",
      default_status: "HALAL"
    },
    honey: {
      terms: ["honey", "royal jelly", "propolis"],
      reason: "Honey/bee products - halal",
      reason_code: "honey_halal",
      default_status: "HALAL"
    }
  }
} as const;

// Certifiers Configuration
export const CERTIFIERS_CONFIG = {
  strong_certifiers: {
    southeast_asia: {
      JAKIM: { full_name: "Jabatan Kemajuan Islam Malaysia", country: "Malaysia", terms: ["jakim", "jakim halal", "jakim certified", "malaysia halal"], strength: "HIGH" },
      MUI: { full_name: "Majelis Ulama Indonesia", country: "Indonesia", terms: ["mui", "mui halal", "lppom mui", "halal mui"], strength: "HIGH" },
      BPJPH: { full_name: "Badan Penyelenggara Jaminan Produk Halal", country: "Indonesia", terms: ["bpjph", "bpjph halal"], strength: "HIGH" },
      MUIS: { full_name: "Majlis Ugama Islam Singapura", country: "Singapore", terms: ["muis", "muis halal", "muis certified", "singapore halal"], strength: "HIGH" },
      CICOT: { full_name: "Central Islamic Council of Thailand", country: "Thailand", terms: ["cicot", "cicot halal", "thailand halal"], strength: "HIGH" },
      HDC: { full_name: "Halal Development Corporation", country: "Malaysia", terms: ["hdc", "hdc halal"], strength: "HIGH" }
    },
    middle_east: {
      ESMA: { full_name: "Emirates Authority for Standardization and Metrology", country: "UAE", terms: ["esma", "esma halal", "uae halal"], strength: "HIGH" },
      EIAC: { full_name: "Emirates International Accreditation Centre", country: "UAE", terms: ["eiac", "eiac halal"], strength: "HIGH" },
      SFDA: { full_name: "Saudi Food and Drug Authority", country: "Saudi Arabia", terms: ["sfda", "sfda halal", "saudi halal"], strength: "HIGH" },
      GSO: { full_name: "GCC Standardization Organization", country: "GCC", terms: ["gso", "gso halal", "gcc halal"], strength: "HIGH" }
    },
    americas: {
      IFANCA: { full_name: "Islamic Food and Nutrition Council of America", country: "USA", terms: ["ifanca", "ifanca halal", "ifanca certified"], strength: "HIGH" },
      ISNA: { full_name: "Islamic Society of North America", country: "USA/Canada", terms: ["isna", "isna halal", "isna certified"], strength: "HIGH" },
      AHF: { full_name: "American Halal Foundation", country: "USA", terms: ["ahf", "ahf halal", "american halal foundation"], strength: "HIGH" },
      ISA: { full_name: "Islamic Services of America", country: "USA", terms: ["isa halal", "islamic services of america"], strength: "HIGH" },
      ISWA: { full_name: "Islamic Society of the Washington Area", country: "USA", terms: ["iswa", "iswa halal"], strength: "MEDIUM" }
    },
    europe: {
      HFA: { full_name: "Halal Food Authority", country: "UK", terms: ["hfa", "hfa halal", "hfa certified", "halal food authority"], strength: "HIGH" },
      HMC: { full_name: "Halal Monitoring Committee", country: "UK", terms: ["hmc", "hmc halal", "hmc certified"], strength: "HIGH" },
      HALAL_UK: { full_name: "Halal Authority Board UK", country: "UK", terms: ["halal authority board", "hab uk"], strength: "MEDIUM" },
      GIMDES: { full_name: "Gida ve Ihtiyac Maddeleri Denetleme ve Sertifikalandirma Arastirmalari Dernegi", country: "Turkey", terms: ["gimdes", "gimdes halal"], strength: "HIGH" },
      HALAL_DE: { full_name: "Halal Control", country: "Germany", terms: ["halal control", "halal control germany"], strength: "MEDIUM" },
      AVS: { full_name: "A Votre Service", country: "France", terms: ["avs", "avs halal"], strength: "MEDIUM" }
    },
    global: {
      SMIIC: { full_name: "Standards and Metrology Institute for Islamic Countries", country: "OIC", terms: ["smiic", "smiic halal", "oic halal"], strength: "HIGH" },
      WHC: { full_name: "World Halal Council", country: "International", terms: ["whc", "world halal council"], strength: "HIGH" },
      IHI_ALLIANCE: { full_name: "International Halal Integrity Alliance", country: "International", terms: ["ihi alliance", "ihi halal"], strength: "HIGH" }
    },
    south_asia: {
      FSSAI_HALAL: { full_name: "Food Safety and Standards Authority of India - Halal", country: "India", terms: ["fssai halal", "india halal"], strength: "MEDIUM" },
      SANHA: { full_name: "South African National Halaal Authority", country: "South Africa", terms: ["sanha", "sanha halal"], strength: "HIGH" },
      NIHT: { full_name: "National Independent Halaal Trust", country: "South Africa", terms: ["niht", "niht halal"], strength: "MEDIUM" }
    },
    oceania: {
      AFIC: { full_name: "Australian Federation of Islamic Councils", country: "Australia", terms: ["afic", "afic halal", "australia halal"], strength: "HIGH" },
      ICCV: { full_name: "Islamic Coordinating Council of Victoria", country: "Australia", terms: ["iccv", "iccv halal"], strength: "MEDIUM" },
      FIANZ: { full_name: "Federation of Islamic Associations of New Zealand", country: "New Zealand", terms: ["fianz", "fianz halal", "nz halal"], strength: "HIGH" }
    }
  },
  generic_strong_terms: [
    "halal certified", "halal-certified", "certified halal", "halal certification",
    "halal cert", "halal approved", "halal logo", "product is halal certified",
    "this product is halal certified", "certified by islamic", "certified by muslim",
    "officially halal", "halal accredited"
  ],
  weak_signals: {
    terms: [
      "halal", "suitable for muslims", "muslim friendly", "no pork",
      "no alcohol", "vegetarian halal", "halal suitable"
    ]
  },
  certification_phrases: {
    strong: [
      "certified by", "approved by", "certified under",
      "halal certificate number", "halal license", "halal registered"
    ]
  }
} as const;

// Allergens Configuration
export const ALLERGENS_CONFIG = {
  soy: {
    direct_terms: ["soy", "soya", "soybean", "soybeans", "soy bean", "soy beans"],
    derived_ingredients: [
      "tofu", "tempeh", "miso", "natto", "edamame", "soy sauce", "shoyu",
      "tamari", "soy milk", "soy protein", "soy flour", "soybean oil",
      "soy oil", "textured vegetable protein", "tvp", "hydrolyzed soy protein",
      "soy lecithin", "soya lecithin"
    ],
    may_contain: ["vegetable protein", "vegetable oil", "natural flavoring"]
  },
  milk: {
    direct_terms: ["milk", "dairy", "lactose"],
    derived_ingredients: [
      "butter", "cheese", "cream", "yogurt", "yoghurt", "whey", "casein",
      "caseinate", "lactalbumin", "lactoglobulin", "ghee", "curds", "custard",
      "ice cream", "buttermilk", "sour cream", "cream cheese", "cottage cheese",
      "half and half", "milk powder", "skim milk", "whole milk", "condensed milk",
      "evaporated milk", "milk solids", "milk fat", "milk protein"
    ],
    may_contain: ["caramel color", "natural flavoring", "high protein flour"]
  },
  egg: {
    direct_terms: ["egg", "eggs"],
    derived_ingredients: [
      "albumin", "albumen", "globulin", "lysozyme", "mayonnaise", "meringue",
      "ovalbumin", "ovomucin", "ovomucoid", "ovovitellin", "egg lecithin",
      "egg white", "egg yolk", "dried egg", "egg powder", "egg solids"
    ],
    may_contain: ["baked goods", "pasta", "noodles"]
  },
  peanut: {
    direct_terms: ["peanut", "peanuts", "groundnut", "groundnuts", "arachis"],
    derived_ingredients: [
      "peanut butter", "peanut oil", "peanut flour", "peanut protein",
      "arachis oil", "monkey nuts", "earth nuts", "goober peas"
    ],
    may_contain: ["mixed nuts", "nut butter", "satay sauce"]
  },
  tree_nuts: {
    direct_terms: ["tree nut", "tree nuts", "nut", "nuts"],
    derived_ingredients: [
      "almond", "almonds", "cashew", "cashews", "walnut", "walnuts",
      "pecan", "pecans", "pistachio", "pistachios", "hazelnut", "hazelnuts",
      "filbert", "macadamia", "brazil nut", "brazil nuts", "pine nut",
      "pine nuts", "chestnut", "chestnuts", "praline", "marzipan", "nougat",
      "gianduja", "almond butter", "almond milk", "almond flour",
      "cashew butter", "hazelnut spread", "nutella"
    ],
    may_contain: []
  },
  wheat: {
    direct_terms: ["wheat", "gluten"],
    derived_ingredients: [
      "flour", "bread", "breadcrumbs", "bulgur", "couscous", "durum",
      "einkorn", "emmer", "farina", "kamut", "semolina", "spelt",
      "triticale", "seitan", "vital wheat gluten", "wheat germ",
      "wheat bran", "wheat starch", "modified wheat starch", "hydrolyzed wheat protein"
    ],
    may_contain: ["maltodextrin", "modified food starch"]
  },
  fish: {
    direct_terms: ["fish"],
    derived_ingredients: [
      "salmon", "tuna", "cod", "halibut", "tilapia", "bass", "trout",
      "mackerel", "sardine", "sardines", "anchovy", "anchovies", "fish sauce",
      "fish oil", "fish gelatin", "omega-3", "dha", "epa", "surimi",
      "imitation crab", "worcestershire sauce", "caesar dressing"
    ],
    may_contain: []
  },
  shellfish: {
    direct_terms: ["shellfish", "crustacean", "crustaceans"],
    derived_ingredients: [
      "shrimp", "prawn", "prawns", "crab", "lobster", "crayfish", "crawfish",
      "langoustine", "scallop", "scallops", "clam", "clams", "mussel", "mussels",
      "oyster", "oysters", "squid", "calamari", "octopus", "snail", "escargot", "abalone"
    ],
    may_contain: ["glucosamine"]
  },
  sesame: {
    direct_terms: ["sesame", "sesame seed", "sesame seeds"],
    derived_ingredients: [
      "tahini", "halvah", "halva", "hummus", "sesame oil",
      "sesame paste", "sesame flour", "benne seeds", "gingelly oil"
    ],
    may_contain: []
  },
  mustard: {
    direct_terms: ["mustard"],
    derived_ingredients: [
      "mustard seed", "mustard seeds", "mustard powder", "mustard oil",
      "dijon", "yellow mustard", "brown mustard"
    ],
    may_contain: ["curry powder", "salad dressing"]
  },
  celery: {
    direct_terms: ["celery"],
    derived_ingredients: ["celeriac", "celery salt", "celery seed", "celery powder"],
    may_contain: ["vegetable broth", "stock cubes"]
  },
  sulfites: {
    direct_terms: ["sulfite", "sulfites", "sulphite", "sulphites", "sulfur dioxide"],
    derived_ingredients: [
      "sodium sulfite", "sodium bisulfite", "sodium metabisulfite",
      "potassium bisulfite", "potassium metabisulfite"
    ],
    may_contain: ["wine", "dried fruit", "grape juice"]
  }
} as const;

// Inherently halal plant-based ingredients
export const INHERENTLY_HALAL_PLANT_SIMPLE = [
  "water", "salt", "sugar", "wheat", "rice", "oats", "corn",
  "cocoa", "cocoa powder", "sunflower oil", "canola oil",
  "soybean oil", "olive oil", "palm oil", "spices",
  "onion powder", "garlic powder", "starch", "tapioca starch"
] as const;

// Haram colorants (as fallback)
export const HARAM_COLORANTS = ["carmine", "cochineal"] as const;

// Mushbooh flavourings
export const MUSHBOOH_FLAVOURINGS = [
  "flavour", "flavouring", "flavor", "flavoring",
  "natural flavour", "natural flavor", "artificial flavour",
  "artificial flavor", "natural flavours", "natural flavors",
  "smoke flavour", "smoke flavor", "aroma"
] as const;
