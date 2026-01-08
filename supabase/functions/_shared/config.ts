// ================================================================
// PureMark Edge Functions - Configuration Data
// Embedded JSON configs for halal/kosher/allergen detection
// ================================================================

// E-Numbers Configuration
export const E_NUMBERS_CONFIG = {
  always_haram: {
    "120": {
      name: "Carmine/Cochineal",
      reason: "Insect-derived colorant (from cochineal beetles)",
      reason_code: "e120_carmine_cochineal_haram"
    },
    "542": {
      name: "Bone Phosphate",
      reason: "Derived from animal bones",
      reason_code: "e542_bone_phosphate_haram"
    },
    "904": {
      name: "Shellac",
      reason: "Insect-derived glaze (from lac beetles)",
      reason_code: "e904_shellac_insect_haram"
    },
    "913": {
      name: "Lanolin",
      reason: "Derived from sheep wool grease (debated, treated as haram in strict mode)",
      reason_code: "e913_lanolin_animal_haram"
    }
  },
  source_dependent: {
    "422": { name: "Glycerol/Glycerin", reason: "Can be animal, plant, or synthetic derived", reason_code: "e422_glycerol_source_unknown" },
    "430": { name: "Polyoxyethylene (8) stearate", reason: "Stearate may be animal-derived", reason_code: "e430_stearate_source_unknown" },
    "431": { name: "Polyoxyethylene (40) stearate", reason: "Stearate may be animal-derived", reason_code: "e431_stearate_source_unknown" },
    "432": { name: "Polysorbate 20", reason: "Fatty acid esters may be animal-derived", reason_code: "e432_polysorbate_source_unknown" },
    "433": { name: "Polysorbate 80", reason: "Fatty acid esters may be animal-derived", reason_code: "e433_polysorbate_source_unknown" },
    "434": { name: "Polysorbate 40", reason: "Fatty acid esters may be animal-derived", reason_code: "e434_polysorbate_source_unknown" },
    "435": { name: "Polysorbate 60", reason: "Fatty acid esters may be animal-derived", reason_code: "e435_polysorbate_source_unknown" },
    "436": { name: "Polysorbate 65", reason: "Fatty acid esters may be animal-derived", reason_code: "e436_polysorbate_source_unknown" },
    "441": { name: "Gelatin", reason: "Animal-derived, source (porcine/bovine/fish) unknown", reason_code: "e441_gelatin_source_unknown" },
    "470": { name: "Fatty Acid Salts", reason: "Fatty acids may be animal-derived", reason_code: "e470_fatty_acid_salts_source_unknown" },
    "471": { name: "Mono- and Diglycerides", reason: "Glycerides may be animal-derived", reason_code: "e471_mono_diglycerides_source_unknown" },
    "472": { name: "Fatty Acid Esters", reason: "Fatty acid esters may be animal-derived", reason_code: "e472_fatty_acid_esters_source_unknown" },
    "473": { name: "Sucrose Esters of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e473_sucrose_esters_source_unknown" },
    "474": { name: "Sucroglycerides", reason: "Glycerides may be animal-derived", reason_code: "e474_sucroglycerides_source_unknown" },
    "475": { name: "Polyglycerol Esters of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e475_polyglycerol_esters_source_unknown" },
    "476": { name: "Polyglycerol Polyricinoleate", reason: "May contain animal-derived components", reason_code: "e476_pgpr_source_unknown" },
    "477": { name: "Propane-1,2-diol Esters of Fatty Acids", reason: "Fatty acids may be animal-derived", reason_code: "e477_propanediol_esters_source_unknown" },
    "481": { name: "Sodium Stearoyl Lactylate", reason: "Stearate may be animal-derived", reason_code: "e481_sodium_stearoyl_lactylate_source_unknown" },
    "482": { name: "Calcium Stearoyl Lactylate", reason: "Stearate may be animal-derived", reason_code: "e482_calcium_stearoyl_lactylate_source_unknown" },
    "483": { name: "Stearyl Tartrate", reason: "Stearate may be animal-derived", reason_code: "e483_stearyl_tartrate_source_unknown" },
    "491": { name: "Sorbitan Monostearate", reason: "Stearate may be animal-derived", reason_code: "e491_sorbitan_monostearate_source_unknown" },
    "492": { name: "Sorbitan Tristearate", reason: "Stearate may be animal-derived", reason_code: "e492_sorbitan_tristearate_source_unknown" },
    "493": { name: "Sorbitan Monolaurate", reason: "Fatty acids may be animal-derived", reason_code: "e493_sorbitan_monolaurate_source_unknown" },
    "494": { name: "Sorbitan Monooleate", reason: "Fatty acids may be animal-derived", reason_code: "e494_sorbitan_monooleate_source_unknown" },
    "495": { name: "Sorbitan Monopalmitate", reason: "Fatty acids may be animal-derived", reason_code: "e495_sorbitan_monopalmitate_source_unknown" },
    "570": { name: "Stearic Acid", reason: "Can be animal or plant-derived", reason_code: "e570_stearic_acid_source_unknown" },
    "572": { name: "Magnesium Stearate", reason: "Stearate may be animal-derived", reason_code: "e572_magnesium_stearate_source_unknown" },
    "631": { name: "Disodium Inosinate", reason: "Often derived from meat or fish", reason_code: "e631_disodium_inosinate_source_unknown" },
    "635": { name: "Disodium 5'-ribonucleotides", reason: "Often derived from meat or fish", reason_code: "e635_disodium_ribonucleotides_source_unknown" },
    "640": { name: "Glycine", reason: "Amino acid, may be animal-derived", reason_code: "e640_glycine_source_unknown" },
    "920": { name: "L-Cysteine", reason: "Often derived from human hair, animal feathers, or hooves", reason_code: "e920_lcysteine_source_unknown" },
    "921": { name: "L-Cystine", reason: "Often derived from human hair, animal feathers, or hooves", reason_code: "e921_lcystine_source_unknown" }
  },
  halal: {
    "100": { name: "Curcumin", reason: "Plant-derived (turmeric)" },
    "101": { name: "Riboflavin (Vitamin B2)", reason: "Synthetic or plant-derived" },
    "160": { name: "Carotenoids", reason: "Plant-derived colorants" },
    "162": { name: "Beetroot Red", reason: "Plant-derived (beetroot)" },
    "163": { name: "Anthocyanins", reason: "Plant-derived (grape skins, berries)" },
    "170": { name: "Calcium Carbonate", reason: "Mineral-derived" },
    "200": { name: "Sorbic Acid", reason: "Synthetic preservative" },
    "202": { name: "Potassium Sorbate", reason: "Synthetic preservative" },
    "270": { name: "Lactic Acid", reason: "Fermentation product (usually plant-based)" },
    "290": { name: "Carbon Dioxide", reason: "Gas" },
    "296": { name: "Malic Acid", reason: "Plant-derived or synthetic" },
    "300": { name: "Ascorbic Acid (Vitamin C)", reason: "Synthetic or plant-derived" },
    "306": { name: "Tocopherols (Vitamin E)", reason: "Plant-derived (vegetable oils)" },
    "322": { name: "Lecithin", reason: "Source varies (soy, sunflower, egg)" },
    "330": { name: "Citric Acid", reason: "Fermentation product or synthetic" },
    "331": { name: "Sodium Citrates", reason: "Derived from citric acid" },
    "332": { name: "Potassium Citrates", reason: "Derived from citric acid" },
    "333": { name: "Calcium Citrates", reason: "Derived from citric acid" },
    "334": { name: "Tartaric Acid", reason: "Plant-derived (grape byproduct)" },
    "335": { name: "Sodium Tartrates", reason: "Derived from tartaric acid" },
    "336": { name: "Potassium Tartrates (Cream of Tartar)", reason: "Plant-derived (grape byproduct)" },
    "338": { name: "Phosphoric Acid", reason: "Mineral-derived" },
    "339": { name: "Sodium Phosphates", reason: "Mineral-derived" },
    "340": { name: "Potassium Phosphates", reason: "Mineral-derived" },
    "341": { name: "Calcium Phosphates", reason: "Mineral-derived" },
    "400": { name: "Alginic Acid", reason: "Plant-derived (seaweed)" },
    "401": { name: "Sodium Alginate", reason: "Plant-derived (seaweed)" },
    "406": { name: "Agar", reason: "Plant-derived (seaweed)" },
    "407": { name: "Carrageenan", reason: "Plant-derived (seaweed)" },
    "410": { name: "Locust Bean Gum", reason: "Plant-derived" },
    "412": { name: "Guar Gum", reason: "Plant-derived" },
    "414": { name: "Gum Arabic", reason: "Plant-derived" },
    "415": { name: "Xanthan Gum", reason: "Fermentation product" },
    "440": { name: "Pectin", reason: "Plant-derived (fruit)" },
    "460": { name: "Cellulose", reason: "Plant-derived" },
    "500": { name: "Sodium Carbonates", reason: "Mineral-derived" },
    "501": { name: "Potassium Carbonates", reason: "Mineral-derived" },
    "503": { name: "Ammonium Carbonates", reason: "Synthetic" },
    "508": { name: "Potassium Chloride", reason: "Mineral-derived" },
    "509": { name: "Calcium Chloride", reason: "Mineral-derived" }
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
