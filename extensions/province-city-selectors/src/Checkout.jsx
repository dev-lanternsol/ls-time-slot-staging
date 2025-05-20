import {
  useApi,
  reactExtension,
  BlockStack,
  Select,
  Text,
  Heading,
  useApplyAttributeChange,
  useAppMetafields,
  useTranslate,
  useLocalizationCountry,
  useSettings,
  Checkbox,
  useCartLines,
  useExtensionCapability,
  useBuyerJourneyIntercept,
} from "@shopify/ui-extensions-react/checkout";

import { provinceCityData } from "./provinceCityData";
import React, { useEffect, useState } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.shipping-option-list.render-before", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const { storage } = useApi();
  //const { extension } = useApi();
  //const instructions = useInstructions();
  const applyAttributeChange = useApplyAttributeChange();
  const cartItems = useCartLines();
  const canBlockProgress = useExtensionCapability("block_progress");
  const { sameDayProvinces, bannedCities, bannedProvinces, expressBannedProvinces } = useSettings();
  const country = useLocalizationCountry();
  const isLebanon = country.isoCode === 'LB';
  const [selectedProvince, setSelectedProvince] = useState("");
  const [provinceError, setProvinceError] = useState(""); // Province error state
  const [selectedCity, setSelectedCity] = useState("");
  const [cityError, setCityError] = useState(""); // City error state
  const [hasSameDay, setHasSameDay] = useState(false);
  const [hasExpressBanned, setHasExpressBanned] = useState(false);
  const [displayExpressDelivery, setDisplayExpressDelivery] = useState(false)
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  var sameDayProvincesList = sameDayProvinces ? sameDayProvinces : '';
  var expressBannedProvincesList = expressBannedProvinces ? expressBannedProvinces : false;

  
  useEffect(() => {
    // Load the saved province from storage when the component loads
    async function loadProvinceFromStorage() {
      const storedProvince = await storage.read("selectedProvince");
      if (storedProvince) {
        setSelectedProvince(storedProvince);
      }
    }
    loadProvinceFromStorage();
  }, []);
  
  // Handle validation in the buyer journey intercept
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (isLebanon) {
      if (canBlockProgress && !selectedProvince) {
        setProvinceError("Province is required.");
        return { behavior: "block", reason: "Province is required." };
      }
      if (canBlockProgress && !selectedCity) {
        setCityError("City is required.");
        return { behavior: "block", reason: "City is required." };
      }
    }

    return { behavior: "allow" };
  });

  const appMetafields = useAppMetafields({
    type: "product",
    namespace: "custom",
    key: "express_delivery"
  }); 

  const totalItemsInCart = cartItems.length;

  // Get the number of items with express_delivery metafield
  const expressDeliveryMetafields = appMetafields.filter(metafield => metafield.metafield.key === 'express_delivery' && metafield.metafield.value == "true");

  // Check if all items have the express_delivery metafield
  if (!displayExpressDelivery && expressDeliveryMetafields.length === totalItemsInCart) {
    setDisplayExpressDelivery(true);
  }

  sameDayProvincesList = sameDayProvincesList.split(',');
  if (expressBannedProvincesList) {
    expressBannedProvincesList = expressBannedProvincesList.split(',');
  }

  async function updateHasSameDayAtribute(hasSameDay) {
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "hasSameDay",
      type: "updateAttribute",
      value: hasSameDay ? 'true' : 'false',
    });
    console.log("applyAttributeChange result", result);
  }

  async function updateProvinceAtribute(province) {
    await storage.write("selectedProvince", province);
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "Province",
      type: "updateAttribute",
      value: `${province}`,
    });
    console.log("applyAttributeChange result", result);
  }

  async function removeProvinceAtribute() {
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "Province",
      type: "updateAttribute",
      value: ``,
    });
    console.log("applyAttributeChange result", result);
  }

  async function updateCityAtribute(city) {
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "City",
      type: "updateAttribute",
      value: `${city}`,
    });
    console.log("applyAttributeChange result", result);
  }

  useEffect(() => {
    updateHasSameDayAtribute(hasSameDay);
  }, [hasSameDay])

  useEffect(() => {
    if (selectedProvince) {
      setHasSameDay(sameDayProvincesList.some(province => selectedProvince.includes(province.trim())));
      if (expressBannedProvincesList) {
        setHasExpressBanned(expressBannedProvincesList.some(province => selectedProvince.includes(province.trim())))
      }
      updateProvinceAtribute(selectedProvince);
      onCheckboxChange(false);
      setProvinceError("");
    } else {
      //removeProvinceAtribute();
    }
  }, [selectedProvince])

  useEffect(() => {
    if (selectedCity) {
      updateCityAtribute(selectedCity);
      setCityError("");
    }
  }, [selectedCity])

  const provinceList = provinceCityData.map(province => ({
    value: province.name,
    label: province.name
  }));

  var filteredProvinceList = provinceList;

  if (bannedProvinces) {
    const bannedProvincesArray = bannedProvinces.split(',').map(province => province.trim());

    filteredProvinceList = provinceList.filter(province => {
      // Check if the province name starts with any banned province
      return !bannedProvincesArray.some(bannedProvince => province.value.startsWith(bannedProvince));
    });
  } 
  
  async function onCheckboxChange(isChecked) {
    // Update the state first so the checkbox is visually updated
    setCheckboxChecked(isChecked);
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "Express",
      type: "updateAttribute",
      value: isChecked ? "true" : "false",
    });
    console.log("applyAttributeChange result", result);
  }

  return (
    <BlockStack padding={"none"}>
      {isLebanon && 
        <Text>{"Please fill all the information to calculate your shipping cost."}</Text>
      }
      {isLebanon && 
        <ProvinceSelector translate={translate} 
          provinceList={filteredProvinceList} 
          selectedProvince={selectedProvince}  
          setSelectedProvince={setSelectedProvince}
          required={canBlockProgress} 
          error={provinceError} />
      }
      {isLebanon && selectedProvince && 
        <CitySelector translate={translate} 
          selectedProvince={selectedProvince}
          selectedCity={selectedCity}
          bannedCities={bannedCities}
          setSelectedCity={setSelectedCity}
          required={canBlockProgress}
          error={cityError} />
      }
      {!hasExpressBanned && displayExpressDelivery && 
        <Checkbox checked={checkboxChecked} id="express" name="express" onChange={(isChecked) => onCheckboxChange(isChecked)}>
          {"Express Delivery +$10 (Available for select products and regions)"}
        </Checkbox>
      }
      {hasExpressBanned && displayExpressDelivery &&
        <Text>Express delivery is not available in this region.</Text>
      }
    </BlockStack>
  );
}

function ProvinceSelector({translate, provinceList, selectedProvince, setSelectedProvince, canBlockProgress, error}) {

  function handleProvinceChange(newProvince) {
    setSelectedProvince(newProvince);
  }

  return (
    <BlockStack padding={"none"}>
      <Select
        label={translate("selectProvinceHeader")}
        value={selectedProvince}
        required={canBlockProgress}
        options={provinceList}
        onChange={handleProvinceChange}
        error={error}
      />
    </BlockStack> 
  )
}

function CitySelector({ translate, selectedProvince, selectedCity, bannedCities, setSelectedCity, canBlockProgress, error }) {
  // Find the selected province from the provinceCityData
  var selectedProvinceData = provinceCityData.find(province => province.name === selectedProvince);
  
  if (bannedCities) {
    selectedProvinceData = removeBannedCitiesFromProvince(selectedProvinceData, bannedCities);
  }
  
  // If there is no selected province, return an empty block
  if (!selectedProvinceData) {
    return null;
  }

  function handleCityChange(city) {
    setSelectedCity(city)
  }

  function removeBannedCitiesFromProvince(selectedProvinceData, bannedCities) {
    // Split the bannedCities string into an array
    const bannedCitiesArray = bannedCities.split(',').map(city => city.trim());
  
    // Filter out the cities that start with or include any banned city
    const filteredCities = selectedProvinceData.cities.filter(city => {
      return !bannedCitiesArray.some(bannedCity => city.startsWith(bannedCity));
    });
  
    // Return a new object with the filtered cities
    return {
      ...selectedProvinceData,
      cities: filteredCities
    };
  }
    

  return (
    <BlockStack padding={"none"}>
      <Select
        label={translate("selectCityHeader")}
        required={canBlockProgress}
        value={selectedCity}
        options={selectedProvinceData.cities.map(city => ({
          value: city,
          label: city
        }))}
        onChange={handleCityChange}
        error={error}
      />
    </BlockStack>
  );
}