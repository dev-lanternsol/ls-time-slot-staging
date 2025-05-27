import {
  reactExtension,
  BlockStack,
  DateField,
  Select,
  Heading,
  useTranslate,
  Text,
  useAppMetafields,
  Banner,
  useSettings,
  useApplyAttributeChange,
  useAttributeValues,
  useLocalizationCountry,
  useExtensionCapability,
  useBuyerJourneyIntercept,
} from "@shopify/ui-extensions-react/checkout";
import React, { useEffect, useState } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.shipping-option-list.render-before", () => (
  <Extension />
));

function Extension() {
  const canBlockProgress = useExtensionCapability("block_progress");
  // Available time slots
  const { monday, monday_cot, 
    tuesday, tuesday_cot, 
    wednesday, wednesday_cot,
    thursday, thursday_cot,
    friday, friday_cot,
    saturday, saturday_cot,
    sunday, sunday_cot, disabledDates } = useSettings();
    // Example usage dummy data for first installation:
    const data_monday_enabled = monday ? true : false;
    const data_tuesday_enabled = tuesday ? true : false;
    const data_wednesday_enabled = wednesday ? true : false;
    const data_thursday_enabled = thursday ? true : false;
    const data_friday_enabled = friday ? true : false;
    const data_saturday_enabled = saturday ? true : false;
    const data_sunday_enabled = sunday ? true : false;

    const data_monday_cot = monday_cot || "";
    const data_tuesday_cot = tuesday_cot || "";
    const data_wednesday_cot = wednesday_cot || "";
    const data_thursday_cot = thursday_cot || "";
    const data_friday_cot = friday_cot || "";
    const data_saturday_cot = saturday_cot || "";
    const data_sunday_cot = sunday_cot || "";
  
    const data_monday = monday || "";
    const data_tuesday = tuesday || "";
    const data_wednesday = wednesday || "";
    const data_thursday = thursday || "";
    const data_friday = friday || "";
    const data_saturday = saturday || "";
    const data_sunday = sunday || "";
  
    const weeklySchedule = `
    monday: ${data_monday_enabled ? data_monday : 'disabled'}
    tuesday: ${data_tuesday_enabled ? data_tuesday : 'disabled'}
    wednesday: ${data_wednesday_enabled ? data_wednesday : 'disabled'}
    thursday: ${data_thursday_enabled ? data_thursday : 'disabled'}
    friday: ${data_friday_enabled ? data_friday : 'disabled'}
    saturday: ${data_saturday_enabled ? data_saturday : 'disabled'}
    sunday: ${data_sunday_enabled ? data_sunday : 'disabled'}
    `;

  const cutOffTimes = {
    monday: data_monday_cot,
    tuesday: data_tuesday_cot,
    wednesday: data_wednesday_cot,
    thursday: data_thursday_cot,
    friday: data_friday_cot,
    saturday: data_saturday_cot,
    sunday: data_sunday_cot
  };

  const translate = useTranslate();
  const appMetafields = useAppMetafields({
    type: "product",
    namespace: "custom",
    key: "second_day_delivery"
  }); 
  const [hasSecondDay, setHasSecondDay] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [timeSlotError, setTimeSlotError] = useState("")
  const [datePickerError, setDatePickerError] = useState("");
  const [selectedDayName, setSelectedDayName] = useState("");
  const [selectedDate, setSelectedDate] = useState();
  const [enableSameDay] = useAttributeValues(['hasSameDay']);
  const applyAttributeChange = useApplyAttributeChange();
  const country = useLocalizationCountry();
  const isLebanon = country.isoCode === 'LB';
  
  // Handle validation in the buyer journey intercept
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (canBlockProgress && !selectedDate) {
      setDatePickerError("Please select a valid date.");
      return { behavior: "block", reason: "Please select a valid date." };
    }

    if (canBlockProgress && !selectedTimeSlot) {
      setTimeSlotError("Please select a time slot.");
      return { behavior: "block", reason: "Please select a time slot." };
    }

    return { behavior: "allow" };
  }); 

  if (!hasSecondDay && appMetafields.some(metafield => metafield.metafield.key === 'second_day_delivery')) {
    setHasSecondDay(true);
  }

  return (
    <BlockStack padding={"none"}>
      {enableSameDay === 'true' && 
        <BlockStack padding={"none"}>
          <Heading level={3}>
            {hasSecondDay ? translate("secondDayBlockHeader") : translate("sameDayBlockHeader") }
          </Heading>
          <DatePickerComponent 
            translate={translate} 
            isLebanon={isLebanon}
            disabledDatesList={disabledDates}
            applyAttributeChange={applyAttributeChange}
            hasSecondDay={hasSecondDay} 
            datePickerError={datePickerError} 
            selectedDate={selectedDate} 
            setDatePickerError={setDatePickerError} 
            setSelectedDayName={setSelectedDayName}
            setSelectedDate={setSelectedDate}
            canBlockProgress={canBlockProgress}
            setSelectedTimeSlot={setSelectedTimeSlot} />
          {weeklySchedule && selectedDate && 
            <TimeSlotPickerComponent 
              translate={translate} 
              applyAttributeChange={applyAttributeChange}
              selectedDayName={selectedDayName} 
              weeklySchedule={weeklySchedule} 
              cutOffTimes={cutOffTimes}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              setSelectedTimeSlot={setSelectedTimeSlot}
              timeSlotError={timeSlotError}
              setTimeSlotError={setTimeSlotError}
              canBlockProgress={canBlockProgress} />}
        </BlockStack>
      }
    </BlockStack>
  );
}

function DatePickerComponent({translate, isLebanon, disabledDatesList, applyAttributeChange, hasSecondDay, datePickerError, selectedDate, setDatePickerError, setSelectedDayName, setSelectedDate, canBlockProgress, setSelectedTimeSlot}) {
  const [dateLimitEnd_localISOTimeFormatted, setDateLimitEnd_localISOTimeFormatted] = useState()
  var dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const [disabledDates, setDisabledDates] = useState([]);

  // Calculate dates within range and disable Sundays
  useEffect(() => {
    const oneMonthFromNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }))
    oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);
    const oneMonthFromNowString = oneMonthFromNow.toISOString().split('T')[0];

    const datesToDisable = [];
    const currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));

    while (currentDate <= oneMonthFromNow) {
      if (currentDate.getDay() === 0) { // Check if Sunday
        datesToDisable.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }

    // Include additional disabled dates from props if available
    let finalDisabledDates = [{ end: dateLimitEnd_localISOTimeFormatted }, { start: oneMonthFromNowString }];
    if (disabledDatesList) {
      const disabledDatesArray = disabledDatesList.includes(",") ? disabledDatesList.replaceAll(" ", "").split(",") : [disabledDatesList];
      finalDisabledDates = finalDisabledDates.concat(disabledDatesArray);
    }

    setDisabledDates(finalDisabledDates.concat(datesToDisable));
  }, [disabledDatesList, dateLimitEnd_localISOTimeFormatted]);

  var currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
  var dateLimitEnd = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
  
  useEffect(() => {
    if (hasSecondDay) {
      currentDate.setDate(currentDate.getDate() + 1);
      dateLimitEnd.setDate(dateLimitEnd.getDate()); 
    } else {
      currentDate.setDate(currentDate.getDate());
      dateLimitEnd.setDate(dateLimitEnd.getDate() - 1); 
    }
    var currentDate_tzoffset = (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }))).getTimezoneOffset() * 60000; //offset in milliseconds
    var currentDate_localISOTime = (new Date(currentDate - currentDate_tzoffset)).toISOString().slice(0, -1);
    var currentDate_localISOTimeFormatted = currentDate_localISOTime.split('T')[0];

    var dateLimitEnd_tzoffset = (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }))).getTimezoneOffset() * 60000; //offset in milliseconds
    var dateLimitEnd_localISOTime = (new Date(dateLimitEnd - dateLimitEnd_tzoffset)).toISOString().slice(0, -1);
    var dateLimitEnd_localISOTimeFormatted = dateLimitEnd_localISOTime.split('T')[0];
    var current_day_number = new Date(currentDate_localISOTimeFormatted).getDay()

    //setSelectedDate(currentDate_localISOTimeFormatted);
    setDateLimitEnd_localISOTimeFormatted(dateLimitEnd_localISOTimeFormatted);
    setSelectedDayName(dayNames[current_day_number])
    
    var dayName = getDayName(currentDate_localISOTimeFormatted, "en-EN");
    //console.log("day", dayName)
    setSelectedDayName(dayName);
  }, [hasSecondDay])

  useEffect(() => {
    updateDateAtribute(selectedDate);
    setSelectedTimeSlot("")
  }, [selectedDate])
  

  // Function to handle date changes
  const handleDateChange = (newDate) => {
    // Check if the new date is a valid date string
    const parsedDate = new Date(newDate);

    if (!newDate || isNaN(parsedDate.getTime())) {
      setDatePickerError("Please select a valid date from the calendar.");
      setSelectedDate(newDate || "");
      setSelectedDayName(""); 
      return;
    }

    setSelectedDate(newDate);
    setDatePickerError(""); // Clear any existing error

    
    var dayName = getDayName(newDate, "en-EN");
    //console.log("day", dayName)
    setSelectedDayName(dayName);
  };

  function getDayName(dateStr, locale) {
    var date = new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
    return date.toLocaleDateString(locale, { weekday: 'long' }).toLowerCase();        
  } 

  // Function to handle the invalid dates
  const handleInvalidDate = () => {
    //console.log("is invalid date")
    setDatePickerError("Please select a valid date from the calendar.");
    setSelectedDate("");
    setSelectedDayName("");
  }

  async function updateDateAtribute(date) {
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "Delivery Date",
      type: "updateAttribute",
      value: `${date}`,
    });
  }

  return (
    <DateField
      label="Select the desired date"
      value={selectedDate}
      onChange={handleDateChange}
      disabled={disabledDates}
      error={datePickerError}
      required={canBlockProgress}
      onInvalid={handleInvalidDate}
    />
  );
}

function TimeSlotPickerComponent({translate, applyAttributeChange, selectedDayName, weeklySchedule, cutOffTimes, selectedDate, selectedTimeSlot, setSelectedTimeSlot, timeSlotError, setTimeSlotError, canBlockProgress}) {
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [parsedWeeklySchedule, setParsedWeeklySchedule] = useState(parseWeeklySchedule(weeklySchedule, cutOffTimes, selectedDate));
  //const parsedWeeklySchedule = parseWeeklySchedule(weeklySchedule, cutOffTimes, selectedDate);

  function handleTimeSlotChange(newTimeSlot) {
    setSelectedTimeSlot(newTimeSlot);
  }

  useEffect(() => {
    updateTimeSlotAtribute(selectedTimeSlot);
    setTimeSlotError("");
  }, [selectedTimeSlot])

  async function updateTimeSlotAtribute(time) {
    if (time) {
      // 4. Call the API to modify checkout
      const result = await applyAttributeChange({
        key: "Time slot",
        type: "updateAttribute",
        value: `${time}`,
      });
    }
  }

  useEffect(() => {
    //console.log(getDaySchedule(parsedWeeklySchedule,selectedDayName), selectedDayName)
    setAvailableTimeSlots(getDaySchedule(parsedWeeklySchedule,selectedDayName));
  }, [selectedDayName, parsedWeeklySchedule])

  useEffect(() => {
    setParsedWeeklySchedule(parseWeeklySchedule(weeklySchedule, cutOffTimes, selectedDate));
  }, [selectedDate])

  function parseWeeklySchedule(weeklySchedule, cutOffTimes, selectedDate) {
    const days = weeklySchedule.split(/(?=\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b)/i);
    const result = {};
    
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" })); // Current date and time
    const today = now.getFullYear() + '-' +
              String(now.getMonth() + 1).padStart(2, '0') + '-' +
              String(now.getDate()).padStart(2, '0');
    
    const isToday = selectedDate === today; // Check if the picked date is today
    
    days.forEach((dayBlock) => {
      if (dayBlock.includes(':')) {
        const [day, schedule] = dayBlock.split(': ');
        const dayLower = day.trim().toLowerCase();

        //console.log(dayLower)
    
        // Apply cut-off time logic only if it's today, otherwise render all schedules
        if (isToday && cutOffTimes[dayLower] && isPastCutOffTime(cutOffTimes[dayLower])) {
          result[dayLower] = { enabled: false, schedule: [] };
        } else if (schedule.trim() === 'disabled') {
          result[dayLower] = { enabled: false, schedule: [] };
        } else {
          //console.log("Enters here")
          const timeBlocks = schedule.split(", ");
          const parsedBlocks = timeBlocks.map((block) => {
            const timeMatch = block.match(/From (.*?) to (.*?) Prep/);
            const prepMatch = block.match(/Prep ([\d.]+)hrs/);
    
            if (timeMatch && prepMatch) {
              const fromTime = timeMatch[1].trim();
              const toTime = timeMatch[2].trim();
              const prepTime = parseFloat(prepMatch[1]);

              // Convert "From" time to a Date object
              const fromDateTime = convertToDateTime(fromTime, dayLower);
              const cutOffTime = convertToDateTime(cutOffTimes[dayLower], dayLower)
    
              // Subtract the preparation time from the "From" time
              fromDateTime.setHours(fromDateTime.getHours() - Math.floor(prepTime));
              fromDateTime.setMinutes(fromDateTime.getMinutes() - Math.floor((prepTime * 60) % 60));

              // Check if the current time is past the prep time, but only if it's today
              let isDisabled = false;
              const isCOTLargerThanFrom = cutOffTime > fromDateTime;

              //console.log(isCOTLargerThanFrom, cutOffTime, fromDateTime, "Prep: ", prepTime)

              if (!isCOTLargerThanFrom || prepTime != 0) {
                isDisabled = isToday && now >= fromDateTime;
              }
    
              // Apply the time comparison logic only if the picked date is today
              return {
                value: `${fromTime} to ${toTime}`,
                label: `${fromTime} to ${toTime}`,
                prep: prepTime,
                disabled: isDisabled,
              };
            }
            return null; // Filter out if not matching or passed
          }).filter(Boolean);
    
          result[dayLower] = { enabled: true, schedule: parsedBlocks };
        }
      }
    });
  
    return result;
  }
  
  function isPastCutOffTime(cutOffTime) {
    //console.log(cutOffTime)
    const timeZone = "Asia/Beirut";
    const [cutOffHours, cutOffMinutes] = cutOffTime.split(":").map(Number);

    // Get current Beirut time parts
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const nowHours = +parts.find(p => p.type === "hour").value;
    const nowMinutes = +parts.find(p => p.type === "minute").value;

    //console.log(`Now in Beirut: ${nowHours}:${nowMinutes}`);
    //console.log(`Cut-off Time: ${cutOffHours}:${cutOffMinutes}`);

    // Compare manually
    if (nowHours > cutOffHours) return true;
    if (nowHours === cutOffHours && nowMinutes > cutOffMinutes) return true;
    return false;
  }

  
  // Helper function to convert time string (e.g., "10:00") to a Date object for the specific day
  function convertToDateTime(time, day) {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const targetDay = dayOfWeek.indexOf(day);
    const currentDay = now.getDay();
  
    const daysAhead = targetDay >= currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay);
  
    const dateTime = new Date(now);
    dateTime.setDate(now.getDate() + daysAhead); // Adjust to the correct day
    dateTime.setHours(hours);
    dateTime.setMinutes(minutes);
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
  
    return dateTime;
  }

  function getDaySchedule(parsedSchedule, day) {
    const dayLowerCase = day.toLowerCase();

    //console.log("Parsed schedule: ", parsedSchedule, day)
    
    // Check if the day exists in the parsed schedule and if it's enabled
    if (parsedSchedule[dayLowerCase] && parsedSchedule[dayLowerCase].enabled) {
      return parsedSchedule[dayLowerCase].schedule;
    } else {
      return []; // Return an empty array if the day is disabled or doesn't exist
    }
  }
  
  return (
    <BlockStack padding={"none"}>
      {availableTimeSlots.length > 0 ? 
        <BlockStack padding={"none"}>
          <Text>{translate("timeSlotHeader")}</Text> 
          <Select
            label={translate("timeSlotSelect", { selectedDayName: selectedDayName.charAt(0).toUpperCase() + selectedDayName.slice(1) })}
            value={selectedTimeSlot}
            required={canBlockProgress}
            options={availableTimeSlots}
            onChange={handleTimeSlotChange}
            error={timeSlotError}
          />
        </BlockStack> : 
        <Banner
          status="info"
          title={translate("noTimeSlotAvailable", { selectedDayName: selectedDayName.charAt(0).toUpperCase() + selectedDayName.slice(1) })}
        />
      }
    </BlockStack>
  );
}