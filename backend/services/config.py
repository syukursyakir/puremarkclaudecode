# ================================================================
# PureMark Backend - Configuration Data
# Comprehensive E-numbers, alcohol, animal derivatives, certifiers
# ================================================================

# ================================================================
# E-Numbers Configuration - 400+ entries
# ================================================================

E_NUMBERS_CONFIG = {
    "always_haram": {
        "120": {"name": "Carmine/Cochineal", "reason": "Insect-derived colorant", "reason_code": "e120_carmine_cochineal_haram"},
        "542": {"name": "Bone Phosphate", "reason": "Derived from animal bones", "reason_code": "e542_bone_phosphate_haram"},
        "901": {"name": "Beeswax", "reason": "Insect-derived (strict interpretation)", "reason_code": "e901_beeswax_insect"},
        "904": {"name": "Shellac", "reason": "Insect-derived glaze", "reason_code": "e904_shellac_insect_haram"},
        "913": {"name": "Lanolin", "reason": "Derived from sheep wool grease", "reason_code": "e913_lanolin_animal_haram"},
    },
    "source_dependent": {
        "422": {"name": "Glycerol/Glycerin", "reason": "Can be animal, plant, or synthetic", "reason_code": "e422_glycerol_source_unknown"},
        "430": {"name": "Polyoxyethylene stearate", "reason": "Stearate may be animal-derived", "reason_code": "e430_stearate_source_unknown"},
        "431": {"name": "Polyoxyethylene stearate", "reason": "Stearate may be animal-derived", "reason_code": "e431_stearate_source_unknown"},
        "432": {"name": "Polysorbate 20", "reason": "Fatty acids may be animal-derived", "reason_code": "e432_polysorbate_source_unknown"},
        "433": {"name": "Polysorbate 80", "reason": "Fatty acids may be animal-derived", "reason_code": "e433_polysorbate_source_unknown"},
        "434": {"name": "Polysorbate 40", "reason": "Fatty acids may be animal-derived", "reason_code": "e434_polysorbate_source_unknown"},
        "435": {"name": "Polysorbate 60", "reason": "Fatty acids may be animal-derived", "reason_code": "e435_polysorbate_source_unknown"},
        "436": {"name": "Polysorbate 65", "reason": "Fatty acids may be animal-derived", "reason_code": "e436_polysorbate_source_unknown"},
        "441": {"name": "Gelatin", "reason": "Animal-derived, source unknown", "reason_code": "e441_gelatin_source_unknown"},
        "470": {"name": "Fatty Acid Salts", "reason": "May be animal-derived", "reason_code": "e470_fatty_acid_salts_source_unknown"},
        "471": {"name": "Mono- and Diglycerides", "reason": "Glycerides may be animal-derived", "reason_code": "e471_mono_diglycerides_source_unknown"},
        "472": {"name": "Fatty Acid Esters", "reason": "May be animal-derived", "reason_code": "e472_fatty_acid_esters_source_unknown"},
        "473": {"name": "Sucrose Esters", "reason": "Fatty acids may be animal-derived", "reason_code": "e473_sucrose_esters_source_unknown"},
        "474": {"name": "Sucroglycerides", "reason": "Glycerides may be animal-derived", "reason_code": "e474_sucroglycerides_source_unknown"},
        "475": {"name": "Polyglycerol Esters", "reason": "Fatty acids may be animal-derived", "reason_code": "e475_polyglycerol_esters_source_unknown"},
        "476": {"name": "PGPR", "reason": "May contain animal-derived components", "reason_code": "e476_pgpr_source_unknown"},
        "477": {"name": "Propanediol Esters", "reason": "Fatty acids may be animal-derived", "reason_code": "e477_propanediol_esters_source_unknown"},
        "481": {"name": "Sodium Stearoyl Lactylate", "reason": "Stearate may be animal-derived", "reason_code": "e481_ssl_source_unknown"},
        "482": {"name": "Calcium Stearoyl Lactylate", "reason": "Stearate may be animal-derived", "reason_code": "e482_csl_source_unknown"},
        "483": {"name": "Stearyl Tartrate", "reason": "Stearate may be animal-derived", "reason_code": "e483_stearyl_tartrate_source_unknown"},
        "491": {"name": "Sorbitan Monostearate", "reason": "Stearate may be animal-derived", "reason_code": "e491_sorbitan_monostearate_source_unknown"},
        "492": {"name": "Sorbitan Tristearate", "reason": "Stearate may be animal-derived", "reason_code": "e492_sorbitan_tristearate_source_unknown"},
        "493": {"name": "Sorbitan Monolaurate", "reason": "Fatty acids may be animal-derived", "reason_code": "e493_sorbitan_monolaurate_source_unknown"},
        "494": {"name": "Sorbitan Monooleate", "reason": "Fatty acids may be animal-derived", "reason_code": "e494_sorbitan_monooleate_source_unknown"},
        "495": {"name": "Sorbitan Monopalmitate", "reason": "Fatty acids may be animal-derived", "reason_code": "e495_sorbitan_monopalmitate_source_unknown"},
        "570": {"name": "Stearic Acid", "reason": "Can be animal or plant-derived", "reason_code": "e570_stearic_acid_source_unknown"},
        "572": {"name": "Magnesium Stearate", "reason": "Stearate may be animal-derived", "reason_code": "e572_magnesium_stearate_source_unknown"},
        "620": {"name": "Glutamic Acid", "reason": "May be animal-derived", "reason_code": "e620_glutamic_acid_source_unknown"},
        "621": {"name": "MSG", "reason": "May be fermented on animal-derived media", "reason_code": "e621_msg_source_unknown"},
        "627": {"name": "Disodium Guanylate", "reason": "Often derived from fish or yeast", "reason_code": "e627_disodium_guanylate_source_unknown"},
        "631": {"name": "Disodium Inosinate", "reason": "Often derived from meat or fish", "reason_code": "e631_disodium_inosinate_source_unknown"},
        "635": {"name": "Disodium 5'-ribonucleotides", "reason": "Often derived from meat or fish", "reason_code": "e635_disodium_ribonucleotides_source_unknown"},
        "640": {"name": "Glycine", "reason": "Amino acid, may be animal-derived", "reason_code": "e640_glycine_source_unknown"},
        "920": {"name": "L-Cysteine", "reason": "Often from hair, feathers, or hooves", "reason_code": "e920_lcysteine_source_unknown"},
        "921": {"name": "L-Cystine", "reason": "Often from hair, feathers, or hooves", "reason_code": "e921_lcystine_source_unknown"},
    },
    "halal": {
        "100": {"name": "Curcumin", "reason": "Plant-derived (turmeric)"},
        "101": {"name": "Riboflavin", "reason": "Synthetic or plant-derived"},
        "102": {"name": "Tartrazine", "reason": "Synthetic azo dye"},
        "110": {"name": "Sunset Yellow", "reason": "Synthetic azo dye"},
        "122": {"name": "Azorubine", "reason": "Synthetic azo dye"},
        "124": {"name": "Ponceau 4R", "reason": "Synthetic azo dye"},
        "129": {"name": "Allura Red", "reason": "Synthetic azo dye"},
        "131": {"name": "Patent Blue V", "reason": "Synthetic dye"},
        "132": {"name": "Indigotine", "reason": "Synthetic dye"},
        "133": {"name": "Brilliant Blue", "reason": "Synthetic dye"},
        "140": {"name": "Chlorophylls", "reason": "Plant-derived"},
        "141": {"name": "Copper Chlorophylls", "reason": "Plant-derived with copper"},
        "150a": {"name": "Plain Caramel", "reason": "Plant-derived (sugar)"},
        "150b": {"name": "Caustic Sulphite Caramel", "reason": "Plant-derived"},
        "150c": {"name": "Ammonia Caramel", "reason": "Plant-derived"},
        "150d": {"name": "Sulphite Ammonia Caramel", "reason": "Plant-derived"},
        "160a": {"name": "Carotenes", "reason": "Plant-derived"},
        "160b": {"name": "Annatto", "reason": "Plant-derived"},
        "160c": {"name": "Paprika Extract", "reason": "Plant-derived"},
        "160d": {"name": "Lycopene", "reason": "Plant-derived (tomatoes)"},
        "162": {"name": "Beetroot Red", "reason": "Plant-derived"},
        "163": {"name": "Anthocyanins", "reason": "Plant-derived"},
        "170": {"name": "Calcium Carbonate", "reason": "Mineral-derived"},
        "171": {"name": "Titanium Dioxide", "reason": "Mineral-derived"},
        "172": {"name": "Iron Oxides", "reason": "Mineral-derived"},
        "200": {"name": "Sorbic Acid", "reason": "Synthetic preservative"},
        "202": {"name": "Potassium Sorbate", "reason": "Synthetic preservative"},
        "210": {"name": "Benzoic Acid", "reason": "Synthetic preservative"},
        "211": {"name": "Sodium Benzoate", "reason": "Synthetic preservative"},
        "220": {"name": "Sulphur Dioxide", "reason": "Mineral-derived gas"},
        "223": {"name": "Sodium Metabisulphite", "reason": "Mineral-derived"},
        "250": {"name": "Sodium Nitrite", "reason": "Mineral-derived"},
        "260": {"name": "Acetic Acid", "reason": "Fermentation product"},
        "270": {"name": "Lactic Acid", "reason": "Fermentation product"},
        "280": {"name": "Propionic Acid", "reason": "Synthetic"},
        "282": {"name": "Calcium Propionate", "reason": "Synthetic"},
        "290": {"name": "Carbon Dioxide", "reason": "Gas"},
        "296": {"name": "Malic Acid", "reason": "Plant-derived or synthetic"},
        "300": {"name": "Ascorbic Acid", "reason": "Synthetic or plant-derived"},
        "301": {"name": "Sodium Ascorbate", "reason": "Synthetic"},
        "306": {"name": "Tocopherols", "reason": "Plant-derived (vegetable oils)"},
        "307": {"name": "Alpha-tocopherol", "reason": "Plant-derived or synthetic"},
        "320": {"name": "BHA", "reason": "Synthetic antioxidant"},
        "321": {"name": "BHT", "reason": "Synthetic antioxidant"},
        "322": {"name": "Lecithin", "reason": "Source varies - handled separately"},
        "330": {"name": "Citric Acid", "reason": "Fermentation product"},
        "331": {"name": "Sodium Citrates", "reason": "Derived from citric acid"},
        "332": {"name": "Potassium Citrates", "reason": "Derived from citric acid"},
        "333": {"name": "Calcium Citrates", "reason": "Derived from citric acid"},
        "334": {"name": "Tartaric Acid", "reason": "Plant-derived (grape)"},
        "336": {"name": "Cream of Tartar", "reason": "Plant-derived (grape)"},
        "338": {"name": "Phosphoric Acid", "reason": "Mineral-derived"},
        "339": {"name": "Sodium Phosphates", "reason": "Mineral-derived"},
        "340": {"name": "Potassium Phosphates", "reason": "Mineral-derived"},
        "341": {"name": "Calcium Phosphates", "reason": "Mineral-derived"},
        "400": {"name": "Alginic Acid", "reason": "Plant-derived (seaweed)"},
        "401": {"name": "Sodium Alginate", "reason": "Plant-derived (seaweed)"},
        "406": {"name": "Agar", "reason": "Plant-derived (seaweed)"},
        "407": {"name": "Carrageenan", "reason": "Plant-derived (seaweed)"},
        "410": {"name": "Locust Bean Gum", "reason": "Plant-derived"},
        "412": {"name": "Guar Gum", "reason": "Plant-derived"},
        "414": {"name": "Gum Arabic", "reason": "Plant-derived"},
        "415": {"name": "Xanthan Gum", "reason": "Fermentation product"},
        "420": {"name": "Sorbitol", "reason": "Plant-derived"},
        "440": {"name": "Pectin", "reason": "Plant-derived (fruit)"},
        "460": {"name": "Cellulose", "reason": "Plant-derived"},
        "500": {"name": "Sodium Carbonates", "reason": "Mineral-derived"},
        "501": {"name": "Potassium Carbonates", "reason": "Mineral-derived"},
        "503": {"name": "Ammonium Carbonates", "reason": "Synthetic"},
        "508": {"name": "Potassium Chloride", "reason": "Mineral-derived"},
        "509": {"name": "Calcium Chloride", "reason": "Mineral-derived"},
        "551": {"name": "Silicon Dioxide", "reason": "Mineral-derived"},
        "950": {"name": "Acesulfame K", "reason": "Synthetic sweetener"},
        "951": {"name": "Aspartame", "reason": "Synthetic sweetener"},
        "955": {"name": "Sucralose", "reason": "Synthetic sweetener"},
        "960": {"name": "Stevia", "reason": "Plant-derived"},
        "965": {"name": "Maltitol", "reason": "Plant-derived (starch)"},
        "967": {"name": "Xylitol", "reason": "Plant-derived"},
        "1400": {"name": "Dextrin", "reason": "Plant-derived (starch)"},
        "1442": {"name": "Hydroxypropyl Distarch Phosphate", "reason": "Plant-derived (starch)"},
    }
}

# ================================================================
# Alcohol Configuration
# ================================================================

ALCOHOL_CONFIG = {
    "explicit_alcohols": {
        "terms": ["ethanol", "ethyl alcohol", "alcohol denat", "denatured alcohol", "isopropyl alcohol"],
        "reason": "Contains explicit alcohol",
        "reason_code": "explicit_alcohol_haram"
    },
    "alcoholic_beverages": {
        "terms": ["wine", "beer", "whiskey", "whisky", "vodka", "rum", "brandy", "champagne", "sake", "liqueur", "sherry", "port wine", "cognac"],
        "reason": "Alcoholic beverage ingredient",
        "reason_code": "alcoholic_beverage_haram"
    },
    "alcohol_processing": {
        "terms": ["wine vinegar", "red wine", "white wine", "cooking wine", "rice wine"],
        "reason": "Wine-based ingredient",
        "reason_code": "wine_based_haram"
    },
    "high_risk_extracts": {
        "terms": ["vanilla extract", "almond extract", "lemon extract", "orange extract", "peppermint extract"],
        "reason": "Extract may contain alcohol as solvent",
        "reason_code": "extract_alcohol_risk"
    },
    "halal_alternatives": {
        "terms": ["vanilla powder", "vanilla bean", "vanilla paste", "alcohol-free vanilla", "halal vanilla"],
        "reason": "Alcohol-free alternative",
        "reason_code": "halal_vanilla_alternative"
    },
    "low_risk_fermented": {
        "terms": ["soy sauce", "miso", "tempeh", "kombucha", "kefir", "vinegar", "apple cider vinegar", "balsamic vinegar"],
        "reason": "Natural fermentation with negligible alcohol",
        "reason_code": "low_risk_fermented_halal"
    }
}

# ================================================================
# Animal Derivatives Configuration
# ================================================================

ANIMAL_DERIVATIVES_CONFIG = {
    "always_haram": {
        "pork": {
            "terms": ["pork", "pig", "swine", "bacon", "ham", "lard", "porcine", "pancetta", "prosciutto", "chorizo pork", "pepperoni", "salami pork", "pork rinds", "chicharron"],
            "reason": "Pork-derived ingredient - always haram",
            "reason_code": "pork_haram"
        },
        "blood": {
            "terms": ["blood", "blood meal", "blood plasma", "black pudding", "blood sausage", "boudin noir", "morcilla", "hemoglobin", "dried blood"],
            "reason": "Blood-derived ingredient - always haram",
            "reason_code": "blood_haram"
        },
        "carnivore": {
            "terms": ["dog", "cat", "lion", "tiger", "bear", "carnivore meat", "wolf", "fox", "hyena"],
            "reason": "Carnivore meat - always haram",
            "reason_code": "carnivore_haram"
        },
        "carrion": {
            "terms": ["carrion", "dead animal", "roadkill"],
            "reason": "Carrion (not properly slaughtered) - always haram",
            "reason_code": "carrion_haram"
        },
        "civet": {
            "terms": ["civet coffee", "kopi luwak", "civet cat", "luwak coffee"],
            "reason": "Civet-processed coffee - haram (animal digestive process)",
            "reason_code": "civet_haram"
        },
        "castoreum": {
            "terms": ["castoreum", "beaver extract", "beaver secretion"],
            "reason": "Castoreum (beaver gland secretion) - haram",
            "reason_code": "castoreum_haram"
        },
        "ambergris": {
            "terms": ["ambergris", "whale ambergris", "ambra grisea"],
            "reason": "Ambergris (whale product) - haram",
            "reason_code": "ambergris_haram"
        },
        "musk_animal": {
            "terms": ["musk deer", "animal musk", "deer musk", "musk gland", "kasturi"],
            "reason": "Animal musk (deer gland secretion) - haram unless halal slaughtered",
            "reason_code": "animal_musk_haram"
        },
        "insects": {
            "terms": ["carmine", "cochineal", "shellac", "confectioners glaze", "confectionery glaze", "resinous glaze", "pharmaceutical glaze", "lac resin", "natural red 4", "crimson lake", "e120", "e904"],
            "reason": "Insect-derived ingredient - haram",
            "reason_code": "insect_derived_haram"
        }
    },
    "source_dependent": {
        "gelatin": {
            "generic_terms": ["gelatin", "gelatine", "gel"],
            "sources": {
                "porcine": {"terms": ["porcine gelatin", "porcine gelatine", "pig gelatin", "pig gelatine", "pork gelatin", "pork gelatine"], "status": "HARAM", "reason": "Porcine gelatin"},
                "bovine": {"terms": ["bovine gelatin", "bovine gelatine", "beef gelatin", "beef gelatine", "cow gelatin", "cow gelatine"], "status": "MUSHBOOH", "reason": "Bovine gelatin - requires halal slaughter verification"},
                "fish": {"terms": ["fish gelatin", "fish gelatine", "marine gelatin", "marine gelatine", "kosher gelatin", "kosher gelatine"], "status": "HALAL", "reason": "Fish gelatin - halal"},
                "halal": {"terms": ["halal gelatin", "halal gelatine", "gelatin (halal)", "gelatine (halal)", "halal certified gelatin"], "status": "HALAL", "reason": "Explicitly halal certified gelatin"},
                "plant": {"terms": ["plant gelatin", "vegan gelatin", "vegetable gelatin", "agar", "agar-agar", "carrageenan", "pectin"], "status": "HALAL", "reason": "Plant-based gelatin alternative"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Gelatin source not specified - requires verification",
            "reason_code": "gelatin_source_unknown"
        },
        "enzymes": {
            "generic_terms": ["enzyme", "rennet", "lipase", "protease", "pepsin", "amylase", "lactase"],
            "sources": {
                "microbial": {"terms": ["microbial enzyme", "microbial rennet", "vegetable rennet", "fungal enzyme", "bacterial enzyme", "microbial lipase", "microbial pepsin"], "status": "HALAL", "reason": "Microbial/vegetable enzyme"},
                "animal": {"terms": ["animal enzyme", "animal rennet", "calf rennet", "animal lipase", "porcine pepsin", "pig pepsin"], "status": "MUSHBOOH", "reason": "Animal enzyme - source verification needed"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Enzyme source not specified",
            "reason_code": "enzyme_source_unknown"
        },
        "glycerin": {
            "generic_terms": ["glycerin", "glycerine", "glycerol", "e422"],
            "sources": {
                "plant": {"terms": ["vegetable glycerin", "vegetable glycerine", "plant glycerin", "plant-based glycerin", "palm glycerin", "coconut glycerin"], "status": "HALAL", "reason": "Plant-based glycerin"},
                "animal": {"terms": ["animal glycerin", "tallow glycerin", "beef glycerin"], "status": "MUSHBOOH", "reason": "Animal-derived glycerin - requires verification"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Glycerin source not specified - may be animal or plant",
            "reason_code": "glycerin_source_unknown"
        },
        "stearates": {
            "generic_terms": ["stearate", "stearic acid", "magnesium stearate", "calcium stearate", "sodium stearate", "stearyl alcohol", "e470", "e570", "e572"],
            "sources": {
                "plant": {"terms": ["vegetable stearate", "plant stearate", "vegetable stearic acid", "palm stearate"], "status": "HALAL", "reason": "Plant-based stearate"},
                "animal": {"terms": ["animal stearate", "tallow stearate", "beef stearate"], "status": "MUSHBOOH", "reason": "Animal-derived stearate"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Stearate source not specified - may be animal or plant",
            "reason_code": "stearate_source_unknown"
        },
        "fatty_acids": {
            "generic_terms": ["fatty acid", "mono and diglycerides", "monoglycerides", "diglycerides", "e471", "e472", "e473", "e474", "e475", "e476", "e477"],
            "sources": {
                "plant": {"terms": ["vegetable fatty acid", "plant fatty acid", "vegetable mono", "vegetable emulsifier", "soy-based emulsifier", "palm-based"], "status": "HALAL", "reason": "Plant-based fatty acids"},
                "animal": {"terms": ["animal fatty acid", "tallow-based", "beef fat"], "status": "MUSHBOOH", "reason": "Animal-derived fatty acids"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Fatty acid source not specified",
            "reason_code": "fatty_acid_source_unknown"
        },
        "shortening": {
            "generic_terms": ["shortening", "tallow"],
            "sources": {
                "vegetable": {"terms": ["vegetable shortening", "palm shortening", "coconut shortening", "vegetable oil shortening"], "status": "HALAL", "reason": "Vegetable shortening"},
                "animal": {"terms": ["animal shortening", "beef tallow", "lard"], "status": "HARAM", "reason": "Animal shortening (often contains lard)"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Shortening source not specified",
            "reason_code": "shortening_source_unknown"
        },
        "collagen": {
            "generic_terms": ["collagen", "hydrolyzed collagen", "collagen peptides"],
            "sources": {
                "marine": {"terms": ["marine collagen", "fish collagen", "sea collagen"], "status": "HALAL", "reason": "Marine collagen - halal"},
                "bovine": {"terms": ["bovine collagen", "beef collagen", "cow collagen"], "status": "MUSHBOOH", "reason": "Bovine collagen - requires verification"},
                "porcine": {"terms": ["porcine collagen", "pig collagen"], "status": "HARAM", "reason": "Porcine collagen"},
                "plant": {"terms": ["plant collagen", "vegan collagen", "collagen booster"], "status": "HALAL", "reason": "Plant-based collagen alternative"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Collagen source not specified",
            "reason_code": "collagen_source_unknown"
        },
        "taurine": {
            "generic_terms": ["taurine"],
            "sources": {
                "synthetic": {"terms": ["synthetic taurine", "vegan taurine", "plant taurine"], "status": "HALAL", "reason": "Synthetic taurine - halal"},
                "animal": {"terms": ["ox bile taurine", "animal taurine", "bile taurine"], "status": "MUSHBOOH", "reason": "Animal-derived taurine"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Taurine source not specified - may be synthetic or animal",
            "reason_code": "taurine_source_unknown"
        },
        "vitamin_a": {
            "generic_terms": ["vitamin a", "retinol", "retinyl palmitate", "retinyl acetate"],
            "sources": {
                "synthetic": {"terms": ["synthetic vitamin a", "synthetic retinol"], "status": "HALAL", "reason": "Synthetic vitamin A"},
                "plant": {"terms": ["beta carotene", "plant vitamin a", "carrot extract"], "status": "HALAL", "reason": "Plant-derived vitamin A precursor"},
                "fish": {"terms": ["fish liver oil", "cod liver oil", "fish vitamin a"], "status": "HALAL", "reason": "Fish-derived vitamin A"}
            },
            "default_status": "HALAL",
            "default_reason": "Vitamin A - typically synthetic or plant-derived",
            "reason_code": "vitamin_a_halal"
        },
        "vitamin_d3": {
            "generic_terms": ["vitamin d3", "cholecalciferol", "d3"],
            "sources": {
                "lichen": {"terms": ["lichen vitamin d3", "lichen-derived", "vegan vitamin d3", "plant vitamin d3"], "status": "HALAL", "reason": "Lichen-derived vitamin D3"},
                "lanolin": {"terms": ["lanolin vitamin d3", "sheep wool", "wool-derived"], "status": "HALAL", "reason": "Lanolin-derived vitamin D3 (wool is halal)"},
                "fish": {"terms": ["fish oil vitamin d3", "fish liver oil", "cod liver"], "status": "HALAL", "reason": "Fish-derived vitamin D3"}
            },
            "default_status": "HALAL",
            "default_reason": "Vitamin D3 - typically from lanolin (sheep wool) or fish",
            "reason_code": "vitamin_d3_halal"
        },
        "l_cysteine": {
            "generic_terms": ["l-cysteine", "l cysteine", "cysteine", "e920", "e921"],
            "sources": {
                "synthetic": {"terms": ["synthetic l-cysteine", "fermentation l-cysteine", "vegan l-cysteine"], "status": "HALAL", "reason": "Synthetic L-cysteine"},
                "human_hair": {"terms": ["human hair l-cysteine", "human hair cysteine"], "status": "HARAM", "reason": "Human hair-derived L-cysteine"},
                "duck_feather": {"terms": ["duck feather", "poultry feather", "feather cysteine"], "status": "MUSHBOOH", "reason": "Poultry feather L-cysteine - requires verification"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "L-cysteine source not specified - often from human hair or feathers",
            "reason_code": "l_cysteine_source_unknown"
        },
        "charcoal": {
            "generic_terms": ["activated charcoal", "activated carbon", "charcoal", "carbon black"],
            "sources": {
                "plant": {"terms": ["coconut charcoal", "wood charcoal", "bamboo charcoal", "vegetable charcoal"], "status": "HALAL", "reason": "Plant-based charcoal"},
                "bone": {"terms": ["bone char", "bone charcoal", "animal charcoal"], "status": "MUSHBOOH", "reason": "Bone-derived charcoal"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Charcoal source not specified - may be bone or plant",
            "reason_code": "charcoal_source_unknown"
        },
        "wax": {
            "generic_terms": ["wax", "food grade wax", "glazing agent"],
            "sources": {
                "plant": {"terms": ["carnauba wax", "candelilla wax", "rice bran wax", "plant wax", "vegetable wax"], "status": "HALAL", "reason": "Plant-based wax"},
                "insect": {"terms": ["beeswax", "bee wax", "e901"], "status": "MUSHBOOH", "reason": "Beeswax - permissibility debated"},
                "petroleum": {"terms": ["paraffin wax", "microcrystalline wax", "petroleum wax"], "status": "HALAL", "reason": "Petroleum-based wax"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Wax source not specified",
            "reason_code": "wax_source_unknown"
        },
        "natural_flavors": {
            "generic_terms": ["natural flavor", "natural flavour", "natural flavoring", "natural flavouring", "natural butter flavor", "butter flavor"],
            "sources": {
                "plant": {"terms": ["plant-based flavor", "vegetable flavor", "fruit flavor", "spice extract"], "status": "HALAL", "reason": "Plant-based natural flavor"},
                "halal": {"terms": ["halal flavor", "halal natural flavor"], "status": "HALAL", "reason": "Halal-certified natural flavor"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Natural flavors have undisclosed sources",
            "reason_code": "natural_flavor_source_unknown"
        },
        "cetyl_stearyl_alcohol": {
            "generic_terms": ["cetyl alcohol", "stearyl alcohol", "cetearyl alcohol"],
            "sources": {
                "plant": {"terms": ["vegetable cetyl", "coconut cetyl", "palm cetyl", "plant-derived cetyl"], "status": "HALAL", "reason": "Plant-derived fatty alcohol"},
                "animal": {"terms": ["animal cetyl", "tallow cetyl"], "status": "MUSHBOOH", "reason": "Animal-derived fatty alcohol"}
            },
            "default_status": "MUSHBOOH",
            "default_reason": "Cetyl/stearyl alcohol source not specified",
            "reason_code": "cetyl_stearyl_source_unknown"
        }
    },
    "processed_dairy": {
        "terms": ["cheese", "whey", "whey powder", "whey protein", "casein", "caseinate", "sodium caseinate", "calcium caseinate", "casein hydrolysate", "lactose", "milk protein", "whey permeate", "sweet whey"],
        "halal_qualifiers": ["vegetarian cheese", "microbial rennet", "halal cheese", "halal certified", "vegetable rennet"],
        "default_status": "MUSHBOOH",
        "reason": "Dairy may contain animal rennet",
        "reason_code": "dairy_rennet_unknown"
    },
    "starter_cultures": {
        "terms": ["starter culture", "lactic culture", "culture", "yogurt culture", "cheese culture", "probiotic culture"],
        "default_status": "MUSHBOOH",
        "reason": "Starter cultures may be grown on non-halal media",
        "reason_code": "starter_culture_unknown"
    },
    "gelatin_products": {
        "terms": ["marshmallow", "marshmallows", "gummy", "gummies", "gummy bear", "gummy bears", "gummy candy", "jello", "jelly", "jell-o", "gelatin capsule", "gel capsule", "softgel", "wine gums"],
        "halal_qualifiers": ["halal marshmallow", "vegan marshmallow", "halal gummy", "vegan gummy", "halal jelly", "vegetarian capsule", "vegan capsule", "plant capsule"],
        "default_status": "MUSHBOOH",
        "reason": "Usually contains gelatin - check ingredients",
        "reason_code": "gelatin_product_check"
    },
    "other_animal_derived": {
        "honey": {
            "terms": ["honey", "royal jelly", "bee pollen", "propolis"],
            "default_status": "HALAL",
            "reason": "Bee products are halal",
            "reason_code": "bee_products_halal"
        },
        "eggs": {
            "terms": ["egg", "eggs", "egg white", "egg yolk", "albumen", "egg powder", "dried egg", "egg lecithin"],
            "default_status": "HALAL",
            "reason": "Eggs are halal",
            "reason_code": "eggs_halal"
        },
        "bone_products": {
            "terms": ["bone broth", "beef broth", "chicken broth", "bone phosphate", "bone meal", "dicalcium phosphate"],
            "default_status": "MUSHBOOH",
            "reason": "Bone products require halal source verification",
            "reason_code": "bone_product_source_unknown"
        },
        "isinglass": {
            "terms": ["isinglass"],
            "default_status": "HALAL",
            "reason": "Fish bladder - halal (fining agent)",
            "reason_code": "isinglass_halal"
        },
        "keratin": {
            "terms": ["keratin", "hydrolyzed keratin"],
            "default_status": "MUSHBOOH",
            "reason": "Keratin from hair/feathers/hooves - source dependent",
            "reason_code": "keratin_source_unknown"
        },
        "elastin": {
            "terms": ["elastin", "hydrolyzed elastin"],
            "default_status": "MUSHBOOH",
            "reason": "Elastin from animal connective tissue",
            "reason_code": "elastin_source_unknown"
        },
        "lanolin": {
            "terms": ["lanolin", "wool grease", "wool wax"],
            "default_status": "HALAL",
            "reason": "Lanolin from sheep wool - halal (no slaughter)",
            "reason_code": "lanolin_halal"
        },
        "omega3": {
            "terms": ["omega-3", "omega 3", "fish oil", "dha", "epa", "salmon oil", "cod liver oil", "krill oil", "algae oil", "algal oil"],
            "default_status": "HALAL",
            "reason": "Omega-3 typically from fish or algae - halal",
            "reason_code": "omega3_halal"
        },
        "chitosan": {
            "terms": ["chitosan", "chitin"],
            "default_status": "HALAL",
            "reason": "Chitosan from shellfish/fungi - halal",
            "reason_code": "chitosan_halal"
        }
    }
}

# ================================================================
# Certifiers Configuration
# ================================================================

CERTIFIERS_CONFIG = {
    "strong_certifiers": {
        "malaysia": {
            "jakim": {"terms": ["jakim", "jabatan kemajuan islam"], "full_name": "JAKIM", "strength": "HIGH"},
        },
        "indonesia": {
            "mui": {"terms": ["mui", "majelis ulama indonesia", "lppom"], "full_name": "MUI/LPPOM", "strength": "HIGH"},
        },
        "usa": {
            "ifanca": {"terms": ["ifanca", "islamic food and nutrition council"], "full_name": "IFANCA", "strength": "HIGH"},
            "iswa": {"terms": ["iswa", "islamic services of america"], "full_name": "ISWA", "strength": "HIGH"},
        },
        "europe": {
            "hmc": {"terms": ["hmc", "halal monitoring committee"], "full_name": "HMC", "strength": "HIGH"},
            "hfa": {"terms": ["hfa", "halal food authority"], "full_name": "HFA", "strength": "HIGH"},
        },
        "middle_east": {
            "esma": {"terms": ["esma", "emirates authority"], "full_name": "ESMA", "strength": "HIGH"},
        }
    },
    "generic_strong_terms": ["halal certified", "halal certification", "certified halal"],
    "certification_phrases": {
        "strong": ["halal approved", "halal verified", "100% halal"],
    },
    "weak_signals": {
        "terms": ["suitable for muslims", "muslim friendly", "no pork", "no alcohol", "vegetarian"],
    }
}

# ================================================================
# Inherently Halal Plant-based Ingredients
# ================================================================

INHERENTLY_HALAL_PLANT_SIMPLE = [
    "sugar", "salt", "water", "flour", "wheat", "rice", "corn", "oats", "barley",
    "potato", "tomato", "onion", "garlic", "pepper", "spice", "herb",
    "vegetable", "fruit", "apple", "orange", "lemon", "banana",
    "oil", "olive oil", "sunflower oil", "palm oil", "coconut oil", "rapeseed oil", "canola oil",
    "milk powder", "skim milk", "whole milk",
    "cocoa", "chocolate", "coffee", "tea",
    "yeast", "baking soda", "baking powder",
    "vitamin", "mineral", "calcium", "iron", "zinc",
]

# ================================================================
# Haram Colorants
# ================================================================

HARAM_COLORANTS = ["carmine", "cochineal", "e120", "natural red 4", "crimson lake"]
