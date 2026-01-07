"""
Comprehensive Test Suite for PureMark Halal Detection Engine

This test suite covers:
1. E-Number detection (Step 1)
2. Alcohol detection (Step 2)
3. Animal derivatives with source detection (Step 3)
4. Halal certification detection (Step 4)
5. Lecithin source detection (existing)
6. Product-level aggregation
7. Integration tests

Run with: python -m pytest tests/test_halal_engine.py -v
Or: python tests/test_halal_engine.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import (
    evaluate_halal_strict,
    check_alcohol_status,
    check_animal_derivative_status,
    check_halal_certification,
    get_e_number_status,
    detect_lecithin_source,
    is_strong_halal_cert_signal,
    is_weak_halal_signal,
    aggregate_product_halal,
    HalalResult,
    HALAL_CONFIRMED,
    HARAM,
    MUSHBOOH,
    NOT_HALAL_UNVERIFIED,
)


class TestENumbers:
    """Test E-number detection from e_numbers.json"""
    
    def test_e120_carmine_haram(self):
        status, details = get_e_number_status("120")
        assert status == "HARAM"
        assert "carmine" in details["name"].lower()
    
    def test_e904_shellac_haram(self):
        status, details = get_e_number_status("904")
        assert status == "HARAM"
        assert "shellac" in details["name"].lower()
    
    def test_e471_source_dependent(self):
        status, details = get_e_number_status("471")
        assert status == "MUSHBOOH"
    
    def test_e920_lcysteine_source_dependent(self):
        status, details = get_e_number_status("920")
        assert status == "MUSHBOOH"
    
    def test_e330_citric_acid_halal(self):
        status, details = get_e_number_status("330")
        assert status == "HALAL"
    
    def test_e322_lecithin_halal(self):
        status, details = get_e_number_status("322")
        assert status == "HALAL"
    
    def test_unknown_enumber(self):
        status, details = get_e_number_status("9999")
        assert status is None
        assert details is None
    
    def test_e120_in_full_evaluation(self):
        result = evaluate_halal_strict("E120 coloring")
        assert result.status == HARAM
    
    def test_e471_in_full_evaluation(self):
        result = evaluate_halal_strict("E471 emulsifier")
        assert result.status == NOT_HALAL_UNVERIFIED


class TestAlcohol:
    """Test alcohol detection from alcohol.json"""
    
    def test_explicit_alcohol(self):
        status, code, reason = check_alcohol_status("alcohol")
        assert status == "HARAM"
    
    def test_wine(self):
        status, code, reason = check_alcohol_status("wine")
        assert status == "HARAM"
    
    def test_mirin(self):
        status, code, reason = check_alcohol_status("mirin")
        assert status == "HARAM"
    
    def test_sake(self):
        status, code, reason = check_alcohol_status("sake")
        assert status == "HARAM"
    
    def test_cooking_wine(self):
        status, code, reason = check_alcohol_status("cooking wine")
        assert status == "HARAM"
    
    def test_vanilla_extract_haram(self):
        status, code, reason = check_alcohol_status("vanilla extract")
        assert status == "HARAM"
    
    def test_bourbon_vanilla_haram(self):
        status, code, reason = check_alcohol_status("bourbon vanilla")
        assert status == "HARAM"
    
    def test_vanilla_bean_halal(self):
        status, code, reason = check_alcohol_status("vanilla bean")
        assert status == "HALAL"
    
    def test_vanilla_powder_halal(self):
        status, code, reason = check_alcohol_status("vanilla powder")
        assert status == "HALAL"
    
    def test_vinegar_halal(self):
        status, code, reason = check_alcohol_status("vinegar")
        assert status == "HALAL"
    
    def test_soy_sauce_halal(self):
        status, code, reason = check_alcohol_status("soy sauce")
        assert status == "HALAL"
    
    def test_beer_batter_haram(self):
        status, code, reason = check_alcohol_status("beer batter")
        assert status == "HARAM"
    
    def test_no_match(self):
        status, code, reason = check_alcohol_status("sugar")
        assert status is None


class TestAnimalDerivatives:
    """Test animal derivatives detection from animal_derivatives.json"""
    
    # Always Haram
    def test_pork_haram(self):
        status, code, reason = check_animal_derivative_status("pork")
        assert status == "HARAM"
    
    def test_lard_haram(self):
        status, code, reason = check_animal_derivative_status("lard")
        assert status == "HARAM"
    
    def test_bacon_haram(self):
        status, code, reason = check_animal_derivative_status("bacon")
        assert status == "HARAM"
    
    def test_blood_haram(self):
        status, code, reason = check_animal_derivative_status("blood")
        assert status == "HARAM"
    
    def test_carmine_haram(self):
        status, code, reason = check_animal_derivative_status("carmine")
        assert status == "HARAM"
    
    def test_shellac_haram(self):
        status, code, reason = check_animal_derivative_status("shellac")
        assert status == "HARAM"
    
    def test_porcine_gelatin_haram(self):
        status, code, reason = check_animal_derivative_status("porcine gelatin")
        assert status == "HARAM"
    
    # Source Dependent - No Source
    def test_gelatin_no_source_mushbooh(self):
        status, code, reason = check_animal_derivative_status("gelatin")
        assert status == "MUSHBOOH"
    
    def test_glycerin_no_source_mushbooh(self):
        status, code, reason = check_animal_derivative_status("glycerin")
        assert status == "MUSHBOOH"
    
    def test_enzymes_no_source_mushbooh(self):
        status, code, reason = check_animal_derivative_status("enzymes")
        assert status == "MUSHBOOH"
    
    def test_rennet_no_source_mushbooh(self):
        status, code, reason = check_animal_derivative_status("rennet")
        assert status == "MUSHBOOH"
    
    def test_collagen_no_source_mushbooh(self):
        status, code, reason = check_animal_derivative_status("collagen")
        assert status == "MUSHBOOH"
    
    def test_lcysteine_no_source_mushbooh(self):
        status, code, reason = check_animal_derivative_status("l-cysteine")
        assert status == "MUSHBOOH"
    
    # Source Dependent - Halal Source
    def test_fish_gelatin_halal(self):
        status, code, reason = check_animal_derivative_status("fish gelatin")
        assert status == "HALAL"
    
    def test_halal_gelatin_halal(self):
        status, code, reason = check_animal_derivative_status("halal gelatin")
        assert status == "HALAL"
    
    def test_vegetable_glycerin_halal(self):
        status, code, reason = check_animal_derivative_status("vegetable glycerin")
        assert status == "HALAL"
    
    def test_microbial_rennet_halal(self):
        status, code, reason = check_animal_derivative_status("microbial rennet")
        assert status == "HALAL"
    
    def test_microbial_enzymes_halal(self):
        status, code, reason = check_animal_derivative_status("microbial enzymes")
        assert status == "HALAL"
    
    def test_marine_collagen_halal(self):
        status, code, reason = check_animal_derivative_status("marine collagen")
        assert status == "HALAL"
    
    # Other Animal Derived
    def test_vitamin_d3_halal(self):
        status, code, reason = check_animal_derivative_status("vitamin d3")
        assert status == "HALAL"
    
    def test_omega3_halal(self):
        status, code, reason = check_animal_derivative_status("omega-3")
        assert status == "HALAL"
    
    def test_lanolin_halal(self):
        status, code, reason = check_animal_derivative_status("lanolin")
        assert status == "HALAL"
    
    def test_honey_halal(self):
        status, code, reason = check_animal_derivative_status("honey")
        assert status == "HALAL"
    
    def test_beeswax_halal(self):
        status, code, reason = check_animal_derivative_status("beeswax")
        assert status == "HALAL"
    
    def test_isinglass_halal(self):
        status, code, reason = check_animal_derivative_status("isinglass")
        assert status == "HALAL"
    
    def test_chitosan_halal(self):
        status, code, reason = check_animal_derivative_status("chitosan")
        assert status == "HALAL"
    
    # Processed Dairy
    def test_cheese_mushbooh(self):
        status, code, reason = check_animal_derivative_status("cheese")
        assert status == "MUSHBOOH"
    
    def test_whey_mushbooh(self):
        status, code, reason = check_animal_derivative_status("whey")
        assert status == "MUSHBOOH"
    
    # Bone Products
    def test_bone_char_mushbooh(self):
        status, code, reason = check_animal_derivative_status("bone char")
        assert status == "MUSHBOOH"


class TestCertification:
    """Test halal certification detection from certifiers.json"""
    
    # Strong Certifiers
    def test_jakim_strong(self):
        strength, cert, region = check_halal_certification("jakim halal")
        assert strength == "HIGH"
        assert "Malaysia" in cert
    
    def test_muis_strong(self):
        strength, cert, region = check_halal_certification("muis certified")
        assert strength == "HIGH"
    
    def test_mui_strong(self):
        strength, cert, region = check_halal_certification("mui halal")
        assert strength == "HIGH"
    
    def test_ifanca_strong(self):
        strength, cert, region = check_halal_certification("ifanca halal")
        assert strength == "HIGH"
    
    def test_hmc_strong(self):
        strength, cert, region = check_halal_certification("hmc certified")
        assert strength == "HIGH"
    
    def test_sanha_strong(self):
        strength, cert, region = check_halal_certification("sanha halal")
        assert strength == "HIGH"
    
    # Generic Strong Terms
    def test_halal_certified_strong(self):
        strength, cert, region = check_halal_certification("halal certified")
        assert strength == "HIGH"
    
    def test_certified_halal_strong(self):
        strength, cert, region = check_halal_certification("certified halal")
        assert strength == "HIGH"
    
    # Weak Signals
    def test_halal_alone_weak(self):
        strength, cert, region = check_halal_certification("halal")
        assert strength == "WEAK"
    
    def test_suitable_for_muslims_weak(self):
        strength, cert, region = check_halal_certification("suitable for muslims")
        assert strength == "WEAK"
    
    # No Signal
    def test_no_signal(self):
        strength, cert, region = check_halal_certification("sugar")
        assert strength == "NONE"
    
    # is_strong_halal_cert_signal
    def test_is_strong_jakim(self):
        assert is_strong_halal_cert_signal("jakim halal") == True
    
    def test_is_strong_halal_certified(self):
        assert is_strong_halal_cert_signal("halal certified") == True
    
    def test_is_strong_halal_alone_false(self):
        assert is_strong_halal_cert_signal("halal") == False
    
    # is_weak_halal_signal
    def test_is_weak_halal_alone(self):
        assert is_weak_halal_signal("halal") == True
    
    def test_is_weak_halal_certified_false(self):
        assert is_weak_halal_signal("halal certified") == False


class TestLecithin:
    """Test lecithin source detection"""
    
    def test_sunflower_lecithin(self):
        is_lecithin, source, explanation = detect_lecithin_source("sunflower lecithin")
        assert is_lecithin == True
        assert source == "sunflower"
    
    def test_soy_lecithin(self):
        is_lecithin, source, explanation = detect_lecithin_source("soy lecithin")
        assert is_lecithin == True
        assert source == "soy"
    
    def test_lecithin_unspecified(self):
        is_lecithin, source, explanation = detect_lecithin_source("lecithin")
        assert is_lecithin == True
        assert source == "unspecified"
    
    def test_french_tournesol(self):
        is_lecithin, source, explanation = detect_lecithin_source("lecithine de tournesol")
        assert is_lecithin == True
        assert source == "sunflower"
    
    def test_rapeseed_lecithin(self):
        is_lecithin, source, explanation = detect_lecithin_source("rapeseed lecithin")
        assert is_lecithin == True
        assert source == "rapeseed"
    
    def test_not_lecithin(self):
        is_lecithin, source, explanation = detect_lecithin_source("sugar")
        assert is_lecithin == False


class TestFullEvaluation:
    """Test the full evaluate_halal_strict function"""
    
    # Haram Results
    def test_pork_haram(self):
        result = evaluate_halal_strict("pork")
        assert result.status == HARAM
    
    def test_blood_haram(self):
        result = evaluate_halal_strict("blood")
        assert result.status == HARAM
    
    def test_wine_haram(self):
        result = evaluate_halal_strict("wine")
        assert result.status == HARAM
    
    def test_vanilla_extract_haram(self):
        result = evaluate_halal_strict("vanilla extract")
        assert result.status == HARAM
    
    # Mushbooh -> NOT_HALAL_UNVERIFIED in strict mode
    def test_gelatin_unverified(self):
        result = evaluate_halal_strict("gelatin")
        assert result.status == NOT_HALAL_UNVERIFIED
    
    def test_glycerin_unverified(self):
        result = evaluate_halal_strict("glycerin")
        assert result.status == NOT_HALAL_UNVERIFIED
    
    def test_cheese_unverified(self):
        result = evaluate_halal_strict("cheese")
        assert result.status == NOT_HALAL_UNVERIFIED
    
    # Halal with specific source
    def test_fish_gelatin_halal(self):
        result = evaluate_halal_strict("fish gelatin")
        assert result.status == HALAL_CONFIRMED
    
    def test_vegetable_glycerin_halal(self):
        result = evaluate_halal_strict("vegetable glycerin")
        assert result.status == HALAL_CONFIRMED
    
    def test_sunflower_lecithin_halal(self):
        result = evaluate_halal_strict("sunflower lecithin")
        assert result.status == HALAL_CONFIRMED
    
    def test_vanilla_bean_halal(self):
        result = evaluate_halal_strict("vanilla bean")
        assert result.status == HALAL_CONFIRMED
    
    def test_honey_halal(self):
        result = evaluate_halal_strict("honey")
        assert result.status == HALAL_CONFIRMED
    
    # Certification overrides mushbooh
    def test_gelatin_certified_halal(self):
        result = evaluate_halal_strict("gelatin jakim certified")
        assert result.status == HALAL_CONFIRMED
    
    def test_cheese_certified_halal(self):
        result = evaluate_halal_strict("cheese halal certified")
        assert result.status == HALAL_CONFIRMED
    
    # Certification does NOT override haram
    def test_pork_certified_still_haram(self):
        result = evaluate_halal_strict("pork halal certified")
        assert result.status == HARAM
    
    def test_blood_certified_still_haram(self):
        result = evaluate_halal_strict("blood jakim halal")
        assert result.status == HARAM
    
    # Inherently halal
    def test_sugar_halal(self):
        result = evaluate_halal_strict("sugar")
        assert result.status == HALAL_CONFIRMED
    
    def test_water_halal(self):
        result = evaluate_halal_strict("water")
        assert result.status == HALAL_CONFIRMED


class TestProductAggregation:
    """Test product-level halal aggregation"""
    
    def test_all_halal_product(self):
        results = [
            HalalResult("sugar", HALAL_CONFIRMED, "HIGH", [], []),
            HalalResult("water", HALAL_CONFIRMED, "HIGH", [], []),
            HalalResult("salt", HALAL_CONFIRMED, "HIGH", [], []),
        ]
        verdict = aggregate_product_halal(results)
        assert verdict.status == "HALAL"
    
    def test_one_haram_fails_product(self):
        results = [
            HalalResult("sugar", HALAL_CONFIRMED, "HIGH", [], []),
            HalalResult("pork", HARAM, "HIGH", ["haram_pork"], []),
            HalalResult("salt", HALAL_CONFIRMED, "HIGH", [], []),
        ]
        verdict = aggregate_product_halal(results)
        assert verdict.status == "HARAM"
    
    def test_one_mushbooh_unverified(self):
        results = [
            HalalResult("sugar", HALAL_CONFIRMED, "HIGH", [], []),
            HalalResult("gelatin", NOT_HALAL_UNVERIFIED, "LOW", ["gelatin_mushbooh"], []),
            HalalResult("salt", HALAL_CONFIRMED, "HIGH", [], []),
        ]
        verdict = aggregate_product_halal(results)
        assert verdict.status == "NOT_HALAL_UNVERIFIED"


def run_all_tests():
    """Run all tests and print results"""
    import traceback
    
    test_classes = [
        TestENumbers,
        TestAlcohol,
        TestAnimalDerivatives,
        TestCertification,
        TestLecithin,
        TestFullEvaluation,
        TestProductAggregation,
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for test_class in test_classes:
        print(f"\n{'='*60}")
        print(f"Running {test_class.__name__}")
        print('='*60)
        
        instance = test_class()
        methods = [m for m in dir(instance) if m.startswith("test_")]
        
        for method_name in methods:
            total_tests += 1
            try:
                getattr(instance, method_name)()
                print(f"  [PASS] {method_name}")
                passed_tests += 1
            except AssertionError as e:
                print(f"  [FAIL] {method_name}: {e}")
                failed_tests.append((test_class.__name__, method_name, str(e)))
            except Exception as e:
                print(f"  [ERROR] {method_name}: {e}")
                failed_tests.append((test_class.__name__, method_name, traceback.format_exc()))
    
    print(f"\n{'='*60}")
    print(f"TEST SUMMARY")
    print('='*60)
    print(f"Total: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {len(failed_tests)}")
    
    if failed_tests:
        print(f"\nFailed tests:")
        for cls, method, error in failed_tests:
            print(f"  - {cls}.{method}")
    
    print('='*60)
    
    return len(failed_tests) == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

