// @ts-check

// Use JSDoc annotations for type safety
/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Operation} Operation
 */

// Define the HideOperation object type
/**
 * @typedef {Object} HideOperation
 * @property {string} deliveryOptionHandle - The handle of the delivery option to hide
 */

// The configured entrypoint for the 'purchase.delivery-customization.run' extension target
/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */

import { shippingRates } from "./shippingOptionsData"

export function run(input) {
  console.log("The function is running");

  // Retrieve both province and express attributes from the input
  const provinceAttribute = input.cart.provinceAttribute?.value;
  const expressAttribute = input.cart.expressAttribute?.value;
  const operations = [];

  if (provinceAttribute) {
    console.log(`Selected Province: ${provinceAttribute}`);
    console.log(`Express Shipping: ${expressAttribute}`);

    const isExpressSelected = expressAttribute === "true";
    const { cart } = input;

    if (cart && cart.deliveryGroups) {
      cart.deliveryGroups.forEach(group => {
        group.deliveryOptions.forEach(option => {
          // Filter shipping rates based on whether express or standard shipping is selected
          const filteredRates = shippingRates.filter(rate => 
            rate.shipping_name.toLowerCase().includes(isExpressSelected ? "express" : "standard") &&
            rate.provinces.some(province => provinceAttribute.startsWith(province))
          );

          // Find the matching rate based on the delivery option title
          const matchingRate = filteredRates.find(rate => rate.shipping_name === option.title);

          if (matchingRate) {
            // Remove price from the title (e.g., "Standard shipping $9" => "Standard shipping")
            const newTitle = option.title.replace(/\s\$\d+/, ""); // Removes the price part

            console.log(`Renaming delivery option: ${option.handle} to "${newTitle}"`);
            operations.push({
              rename: {
                deliveryOptionHandle: option.handle,
                title: newTitle,
              },
            });

            console.log(`Showing ${isExpressSelected ? 'express' : 'standard'} delivery option: ${option.handle}`);
          } else {
            // Hide the delivery option if it doesn't match the criteria
            console.log(`Hiding delivery option: ${option.handle}`);
            operations.push({
              hide: {
                deliveryOptionHandle: option.handle,
              },
            });
          }
        });
      });
    } else {
      console.log("No delivery groups found");
    }
  } else {
    console.log("No province attribute defined, hiding all delivery options");
    input.cart.deliveryGroups.forEach(group => {
      group.deliveryOptions.forEach(option => {
        operations.push({
          hide: {
            deliveryOptionHandle: option.handle,
          },
        });
      });
    });
  }

  return { operations };
};
