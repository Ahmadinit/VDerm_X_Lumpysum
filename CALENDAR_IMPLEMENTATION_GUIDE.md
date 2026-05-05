# Calendar Component Implementation Guide

**Status**: Planning document for appointment booking calendar  
**Date**: May 5, 2026

---

## 📋 Current State

**File**: `VDerm-X/src/Screens/appointmentBookingScreen.tsx` (Step 2)

**Current Implementation** (Poor UX):
```typescript
<TextInput
  style={styles.input}
  placeholder="2026-05-15"
  value={appointmentDate}
  onChangeText={handleDateSelect}
/>
```

**Issues**:
- ❌ User must type date manually
- ❌ Error-prone (wrong format)
- ❌ No visual feedback
- ❌ No date validation
- ❌ Poor mobile experience

---

## 🎯 Options for Calendar Implementation

### **Option 1: React Native Calendar Picker** (Recommended)
**Package**: `react-native-calendar-picker`  
**Pros**:
- ✅ Customizable calendar UI
- ✅ Range selection support
- ✅ Easy styling
- ✅ Active development
- ✅ Good TypeScript support

**Cons**:
- Extra dependency
- Slightly larger bundle

**Installation**:
```powershell
npm install react-native-calendar-picker
npm install react-native-calendars --save-dev # peer dependency
```

**Implementation**:
```typescript
import CalendarPicker from 'react-native-calendar-picker';

<CalendarPicker
  onDateChange={(date) => {
    setAppointmentDate(date.format('YYYY-MM-DD'));
  }}
  minDate={new Date()} // Prevent past dates
  selectedDayColor='#0066cc'
  selectedDayTextColor='#fff'
  height={320}
  width={300}
/>
```

---

### **Option 2: @react-native-community/datetimepicker** (Native)
**Package**: `@react-native-community/datetimepicker`  
**Pros**:
- ✅ Native picker (iOS/Android)
- ✅ Familiar to users
- ✅ Small footprint
- ✅ No custom styling needed
- ✅ Official community package

**Cons**:
- Limited customization
- Platform-specific behavior

**Installation**:
```powershell
npm install @react-native-community/datetimepicker
```

**Implementation**:
```typescript
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

const [showDatePicker, setShowDatePicker] = useState(false);

<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <Text>{appointmentDate || 'Select Date'}</Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    display="spinner"
    onChange={(event, selectedDate) => {
      setAppointmentDate(selectedDate.toISOString().split('T')[0]);
      setShowDatePicker(false);
    }}
    minimumDate={new Date()}
  />
)}
```

---

### **Option 3: React Native Calendars** (Advanced)
**Package**: `react-native-calendars`  
**Pros**:
- ✅ Feature-rich
- ✅ Beautiful UI
- ✅ Extensive customization
- ✅ Period/range selection
- ✅ Marked dates support (showing blocked times)

**Cons**:
- Overkill for simple date selection
- Larger bundle
- More learning curve

**Installation**:
```powershell
npm install react-native-calendars
```

**Implementation**:
```typescript
import { Calendar } from 'react-native-calendars';

<Calendar
  onDayPress={(day) => {
    setAppointmentDate(day.dateString);
  }}
  markedDates={{
    [appointmentDate]: {
      selected: true,
      disableTouchEvent: true,
      selectedColor: '#0066cc',
      selectedTextColor: '#ffffff',
    },
  }}
  minDate={new Date().toISOString().split('T')[0]}
/>
```

---

## 🏆 RECOMMENDATION: Option 1 (React Native Calendar Picker)

**Why?**
- Best balance of features and simplicity
- Good customization options
- Easy to implement
- Perfect for this use case

---

## 📝 Implementation Steps

### Step 1: Install Package
```powershell
cd VDerm-X
npm install react-native-calendar-picker react-native-calendars
```

### Step 2: Update appointmentBookingScreen.tsx

**Add import**:
```typescript
import CalendarPicker from 'react-native-calendar-picker';
```

**Replace Step 2 date selection section**:
```typescript
// Step 2: Select Date & Time
if (step === 2) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Select Date & Time</Text>
      <Text style={styles.subtitle}>
        Dr. {selectedVet?.firstName} {selectedVet?.lastName}
      </Text>

      <Text style={styles.label}>Select Date</Text>
      
      {/* NEW: Calendar Picker */}
      <View style={styles.calendarContainer}>
        <CalendarPicker
          onDateChange={(date) => {
            const formattedDate = date.format('YYYY-MM-DD');
            handleDateSelect(formattedDate);
          }}
          minDate={new Date()}
          selectedDayColor='#0066cc'
          selectedDayTextColor='#fff'
          height={300}
          width={300}
          todayBackgroundColor='#e6f2ff'
          weekdays={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
          months={[
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ]}
        />
      </View>

      {/* Display selected date */}
      {appointmentDate && (
        <Text style={styles.selectedDateText}>
          Selected: {appointmentDate}
        </Text>
      )}

      {/* Fetch slots button */}
      {appointmentDate && (
        <TouchableOpacity
          style={styles.button}
          onPress={fetchAvailableSlots}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Get Available Slots'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Rest of the component remains the same... */}
      {availableSlots.length > 0 && (
        <>
          <Text style={styles.label}>Available Time Slots</Text>
          <View style={styles.slotsGrid}>
            {availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  selectedTime === slot.time && styles.timeSlotSelected,
                ]}
                onPress={() => setSelectedTime(slot.time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === slot.time && styles.timeSlotTextSelected,
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Rest remains the same... */}
    </ScrollView>
  );
}
```

### Step 3: Add Styles

```typescript
calendarContainer: {
  alignItems: 'center',
  marginVertical: 20,
  backgroundColor: '#f9f9f9',
  borderRadius: 10,
  padding: 10,
},
selectedDateText: {
  fontSize: 14,
  color: '#0066cc',
  fontWeight: '600',
  marginTop: 10,
  textAlign: 'center',
},
```

### Step 4: Test the Implementation

1. Navigate to AppointmentBooking screen
2. Click on the calendar
3. Select a date
4. Verify the date is set correctly
5. Click "Get Available Slots"
6. Verify slots are fetched

---

## 🧪 Testing Scenarios

### Scenario 1: Normal Date Selection
1. Open calendar
2. Select a future date (e.g., May 20)
3. Verify date shows as selected
4. Click "Get Available Slots"
5. Verify slots load ✅

### Scenario 2: Block Past Dates
1. Open calendar
2. Try to click a past date
3. Verify it's disabled (if minDate is set) ✅

### Scenario 3: Change Selection
1. Select May 20
2. Select May 25
3. Verify May 25 is now selected
4. Verify previous selection is cleared ✅

### Scenario 4: Linked to Backend
1. Select date
2. Fetch slots
3. Verify API call to `/appointments/availability/:vetId`
4. Verify slots display correctly ✅

---

## 🔧 Additional Features (Future)

### Show Blocked Dates
```typescript
// Mark dates with no availability as unavailable
<CalendarPicker
  disabledDates={['2026-05-05', '2026-05-06']}
  disabledDatesTextColor='#d3d3d3'
  // ...
/>
```

### Show Available Dates Only
```typescript
// Only show dates with at least one available slot
const fetchAvailableDateRange = async () => {
  // Call backend to get all dates with slots for this vet
  const response = await fetch(
    `${apiUrl}/appointments/availability/${selectedVet._id}?month=2026-05`
  );
  const { availableDates } = await response.json();
  // Show only available dates
};
```

### Highlight Busy Dates
```typescript
const [markedDates, setMarkedDates] = useState({
  '2026-05-15': { marked: true, color: '#ff6b6b' }, // Busy
  '2026-05-16': { marked: true, color: '#51cf66' }, // Available
});

<CalendarPicker
  markedDates={markedDates}
  // ...
/>
```

---

## 📊 Implementation Timeline

| Step | Time | Notes |
|------|------|-------|
| Install package | 5 mins | npm install |
| Update component | 15 mins | Replace TextInput |
| Add styling | 5 mins | Simple styles |
| Test | 10 mins | Verify date selection |
| Test API | 10 mins | Verify slot fetching |
| **Total** | **45 mins** | Full implementation |

---

## ⚠️ Important Notes

1. **Date Format**: Keep using `YYYY-MM-DD` for API compatibility
2. **Timezone**: Be aware of timezone issues (store as UTC)
3. **Validation**: Always validate date on backend
4. **Performance**: Calendar doesn't impact performance
5. **Accessibility**: Calendar picker is accessible

---

## 🎉 Ready to Implement?

Run these commands:
```powershell
cd VDerm-X
npm install react-native-calendar-picker react-native-calendars
```

Then update `src/Screens/appointmentBookingScreen.tsx` with the code above.

**Estimated time**: 45 minutes for complete implementation + testing

---

## 📞 Troubleshooting

### Calendar not showing
- Check if component is imported
- Verify dependencies installed
- Check styling (height/width)

### Date format issues
- Calendar returns date object, need to format
- Use `date.format('YYYY-MM-DD')`
- Ensure backend expects same format

### Styling issues
- Calendar Picker has extensive styling options
- Check theme colors match app design
- Adjust width/height as needed

---

## ✅ Checklist After Implementation

- [ ] Calendar displays properly
- [ ] Can select dates
- [ ] Date updates correctly
- [ ] API call works after date selection
- [ ] Slots display after fetching
- [ ] Can continue to next step
- [ ] Works on both iOS and Android

---

**Status**: Ready to implement! 🚀
