import React, { createContext, useEffect, useState } from "react";
import { BleManager, Device, BleError } from "react-native-ble-plx";
import { Buffer } from "buffer";
import { USE_MOCK_DATA, USE_GPIO_TEST_MODE } from '../src/config';
import { mockBluetoothData } from './mockBluetoothData';
// Create Bluetooth Context
export const BatteryBluetoothContext = createContext<any>(null);

const manager = new BleManager();

// Error Code Mapping for Msg_DIU1 Faults
const ERROR_CODES: { [key: number]: string } = {
  0: "General Battery Fault",
  1: "Battery Over Temperature",
};

export const BatteryBluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [data, setData] = useState<any>({}); // Holds parsed CAN data

   useEffect(() => {
  if (USE_MOCK_DATA) {
    setData(mockBluetoothData); // one-time injection
    return;
  }
}, []);
useEffect(() => {
  if (!USE_MOCK_DATA && !USE_GPIO_TEST_MODE) return;

  const interval = setInterval(() => {
    setData((prev: any) => {
      const updatedData: any = { ...prev };

      if (USE_MOCK_DATA) {
        const randomFaults = [
          "sigFltControllerOverCurrent",
          "sigFltEEPROMFailure",
          "sigFltMotorHotCutback",
          "sigFltThrottlewiperLow",
        ];
        const activeFaults = Math.random() > 0.65
          ? [randomFaults[Math.floor(Math.random() * randomFaults.length)]]
          : [];

        updatedData.messageDIU4 = {
          ...prev.messageDIU4,
          stateOfCharge: Math.max(
            0,
            Math.min(100, (prev.messageDIU4?.stateOfCharge ?? 50) + (Math.random() > 0.5 ? 1 : -1))
          ),
        };

        updatedData.messageDriveParameters = {
          ...prev.messageDriveParameters,
          maxCellTemp: 30 + Math.round(Math.random() * 10),
          minCellTemp: 20 + Math.round(Math.random() * 5),
        };

        const motorRPM = updatedData.messageMCU2?.motorRPM ?? 0;
const K = 0.00814; // derived from your vehicle parameters
const calculatedSpeed = +(motorRPM * K).toFixed(1);

updatedData.messageMCU1 = {
  ...prev.messageMCU1,
  speed: calculatedSpeed, // 👈 inject calculated speed
  throttle: Math.floor(Math.random() * 100),
  brake: Math.floor(Math.random() * 30),
  rmsCurrent: Math.round(100 + Math.random() * 50),
};

        updatedData.messageMCU2 = {
          ...prev.messageMCU2,
          motorRPM: Math.floor(1000 + Math.random() * 4000),
          odometer: Number((prev.messageMCU2?.odometer ?? 0) + 0.2),
        };

        updatedData.messageMCU3 = {
          ...prev.messageMCU3,
          faultMessages: activeFaults.length ? activeFaults : ["No Faults Detected"],
        };
      }

      if (USE_GPIO_TEST_MODE) {
        updatedData.gpioStates = {
          messageType: "GPIO",
          states: {
            REV_OUT: false,
            FWD_OUT: true,
            KEY_OUT: true,
            BRAKE_OUT: true,
            LOWB_OUT: false,
            HIGHB_OUT: true,
            LEFT_OUT: Math.random() > 0.5,
            RIGHT_OUT: Math.random() > 0.5,
            SPORTS_OUT: Math.random() > 0.5,
            ECO_OUT: Math.random() > 0.5,
            NEUTRAL_OUT: false,
          },
        };
      }
        const now = Date.now();
  updatedData.rawFrame = {
    id: Math.random() > 0.5 ? '18265040' : '14234050',
    bytes: Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    ),
    timeOffsetMs: (now - logStartTime) / 1000, // ⬅️ Add this line
    type: 'Rx',
  };

      return updatedData;
    });
  }, 1000);

  return () => clearInterval(interval);
}, []);



  const connectToDevice = async (device: Device) => {
    try {
      await device.connect();
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);

      const serviceUUID = "7E400001-B5A3-F393-E0A9-E50E24DCCA9E";
      const characteristicUUID = "7E400002-B5A3-F393-E0A9-E50E24DCCA9E";

      device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
  if (error) {
    console.error("❌ Bluetooth Read Error:", error.message);
    return;
  }

  if (characteristic?.value) {
    const base64Val = characteristic.value;
    console.log("📦 [BLE] Raw base64 BLE value:", base64Val);

    const decodedData = parseBluetoothData(base64Val);

    if (decodedData?.gpioStates?.states) {
      console.log("🧪 [BLE] GPIO states updated in context:", decodedData.gpioStates.states);
    }

    setData((prevData: any) => {
  const motorRPM = decodedData.messageMCU2?.motorRPM ?? prevData.messageMCU2?.motorRPM ?? 0;
  const K = 0.00814; // Calculated from 407mm tire, GR=1, FDR=9.42
  const calculatedSpeed = +(motorRPM * K).toFixed(1);

  return {
    ...prevData,
    ...decodedData,
    messageMCU1: {
      ...(decodedData.messageMCU1 || prevData.messageMCU1 || {}),
      speed: calculatedSpeed,
    },
    rawFrame: decodedData.rawFrame,
  };
});
  }
});
    } catch (error) {
      console.error("Connection Error:", error);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        if (await connectedDevice.isConnected()) {
          await connectedDevice.cancelConnection();
        }
      } catch (error) {
        console.error("Disconnect Error:", (error as BleError).message);
      } finally {
        setConnectedDevice(null);
        setData({});
      }
    }
  };

  const extractBits = (buffer: Buffer, startBit: number, size: number) => {
    let value = 0;
    for (let i = 0; i < size; i++) {
        const byteIndex = Math.floor((startBit + i) / 8);
        const bitIndex = (startBit + i) % 8;
        value |= ((buffer[byteIndex] >> bitIndex) & 1) << i; // Intel format
    }
    return value;
};
 const logStartTime = Date.now();
  const parseBluetoothData = (rawData: string) => {
    try {
      const buffer = Buffer.from(rawData, "base64");
     if (buffer.length < 4) {
      console.error("❌ [BLE] Incomplete packet - buffer too short:", buffer.length);
      return { error: "BLE packet too short" };
    }

    const messageID = buffer.readUInt32BE(0).toString(16).padStart(8, "0").toUpperCase();
    const payload = buffer.slice(4); // May be 0–8 bytes
    const timeOffsetMs = Date.now() - logStartTime;
const rawFrame = {
  id: messageID, // e.g. "18265040"
  bytes: [...payload].map(b => b.toString(16).padStart(2, '0').toUpperCase()), // hex byte array
  timeOffsetMs: timeOffsetMs / 1000, // seconds with decimal
  type: 'Rx', // fixed for now
};
    console.log("📨 [BLE] Parsed Message ID:", messageID);
    console.log("📦 [BLE] Raw hex buffer:", buffer.toString("hex"));
    console.log("📏 [BLE] Payload length:", payload.length);

      switch (messageID) {
        case "1038FF50": // Msg_DIU1
          if (payload.length < 8) return { error: "Invalid Msg_DIU1 Data" };
          return { messageDIU1: parseMsgDIU1(payload),  rawFrame };
        case "14234050": // Msg_DIU2
          if (payload.length < 8) return { error: "Invalid Msg_DIU2 Data" };
          return { messageDIU2: parseMsgDIU2(payload), rawFrame };
        case "14244050": // Msg_DIU3
          if (payload.length < 8) return { error: "Invalid Msg_DIU3 Data" };
          return { messageDIU3: parseMsgDIU3(payload), rawFrame };
        case "10281050": // Msg_DIU4
          if (payload.length < 8) return { error: "Invalid Msg_DIU4 Data" };
          return { messageDIU4: parseMsgDIU4(payload), rawFrame };
        case "1031FF50": // Msg_DIU14
          if (payload.length < 8) return { error: "Invalid Msg_DIU14 Data" };
          return { messageDIU14: parseMsgDIU14(payload), rawFrame };
        case "14498250": // Msg_DriveParameters
          if (payload.length < 8) return { error: "Invalid Msg_DriveParameters Data" };
          return { messageDriveParameters: parseMsgDriveParameters(payload), rawFrame };
         case "18265040": // MCU1 (18265040 dec)
          if (payload.length < 8) return { error: "Invalid MCU1 Data" };
          return { messageMCU1: parseMsgMCU1(payload), rawFrame };
        case "18275040": // MCU2 (18275040 dec)
          if (payload.length < 8) return { error: "Invalid MCU2 Data" };
          return { messageMCU2: parseMsgMCU2(payload), rawFrame };
        case "18305040": // MCU3 (18305040 dec)
          if (payload.length < 8) return { error: "Invalid MCU3 Data" };
          return { messageMCU3: parseMsgMCU3(payload), rawFrame };
          case "FEED0001":
  console.log("📥 [BLE] GPIO message received");
  if (payload.length < 2) {
    console.error("❌ [BLE] GPIO payload too short:", payload.length);
    return { error: "Invalid GPIO Data" };
  }
  

  const parsedGPIO = parseGPIOMsg(payload);
  console.log("✅ [BLE] Final GPIO State Map:", parsedGPIO.states);
  return { gpioStates: parsedGPIO };
        default:
          console.warn("Unknown Message ID:", messageID);
          return { error: "Unknown Message ID", messageID };
      }
    } catch (error) {
      console.error("❌ Parsing error:", (error as Error).message);
      return { parsingError: (error as Error).message };
    }
  };

  const parseMsgDIU1 = (buffer: Buffer) => {
    const faults: string[] = [];
    const signals = [
      { name: "sigFltBatteryFault", startBit: 0, size: 1 },
      { name: "sigFltBatteryOverTemp", startBit: 1, size: 1 },
    ];
    signals.forEach((s) => {
      if (extractBits(buffer, s.startBit, s.size)) faults.push(s.name);
    });
    return { messageType: "Faults", faultMessages: faults.length ? faults : ["No Faults Detected"] };
  };

  const parseMsgDIU2 = (buffer: Buffer) => {
    const sigBatteryCurrent = buffer.readInt16LE(0) * 0.1; // Signed, little-endian, factor 0.1
    const driveLSB = buffer.readUInt8(2); // StartBit 16
    const driveMSB = buffer.readUInt8(5); // StartBit 40
    const sigDriveCurrentLimit = (driveMSB << 8) | driveLSB; // Little-endian
    const regenLSB = buffer.readUInt8(3); // StartBit 24
    const regenMSB = buffer.readUInt8(6); // StartBit 48
    const sigRegenCurrentLimit = (regenMSB << 8) | regenLSB; // Little-endian
    const sigVehicleModeRequest = extractBits(buffer, 32, 3); // 3 bits, unsigned
    return {
      messageType: "Current and Limits",
      batteryCurrent: sigBatteryCurrent,
      driveCurrentLimit: sigDriveCurrentLimit,
      regenCurrentLimit: sigRegenCurrentLimit,
      vehicleModeRequest: sigVehicleModeRequest,
    };
  };

  const parseMsgDIU3 = (buffer: Buffer) => {
    return {
      messageType: "Cell Voltages",
      minCellVoltage: buffer.readUInt16LE(0) * 0.001, // Little-endian, factor 0.001
      maxCellVoltage: buffer.readUInt16LE(4) * 0.001, // Little-endian, factor 0.001
    };
  };

  const parseMsgDIU4 = (buffer: Buffer) => {
    return {
      messageType: "SOC and Indicators",
      stateOfCharge: buffer.readUInt8(0), // Factor 1.0, 0-100
      keyOnIndicator: extractBits(buffer, 34, 2), // 2 bits, unsigned
      distanceToEmpty: buffer.readUInt16BE(1), // StartBit 8, big-endian
      batteryMalfunctionLight: extractBits(buffer, 36, 2), // 2 bits, unsigned
    };
  };

  const parseMsgDIU14 = (buffer: Buffer) => {
    return {
      messageType: "DIU14 Faults",
      socOrPackVoltageImbalance: extractBits(buffer, 4, 1), // Bit 4, unsigned
      batterySevUnderVtgAnyBP: extractBits(buffer, 4, 1), // Bit 3, unsigned
      batterySevOverVtgAnyBP: extractBits(buffer, 2, 1), // Bit 2, unsigned
      overCurrentAllBP: extractBits(buffer, 1, 1), // Bit 1, unsigned
      overCurrentAnyBP: extractBits(buffer, 0, 1), // Bit 0, unsigned
    };
  };

  const parseMsgDriveParameters = (buffer: Buffer) => {
    return {
      messageType: "Drive Parameters",
      packVoltage: buffer.readUInt16BE(0) * 0.01,
      noOfActiveBPs: buffer.readUInt8(2),
      noOfCommunicationLossBPs: buffer.readUInt8(3),
      maxCellTemp: buffer.readInt8(4), // Start 32, signed
      minCellTemp: buffer.readInt8(5), // Start 40, signed
      availableEnergy: buffer.readUInt16LE(6) * 0.01,
    };
  };

  const parseMsgMCU1 = (buffer: Buffer) => {
    const sigControllerTemperature = buffer.readInt8(0); // Signed, start 0, factor 1
    const sigMotorTemperature = buffer.readInt8(1); // Signed, start 8, factor 1
    const sigRMSCurrent = buffer.readUInt16LE(2) * 0.1; // Unsigned, start 16, factor 0.1, little-endian
    const sigThrottle = buffer.readUInt8(4); // Unsigned, start 32, factor 1
    const sigBrake = buffer.readUInt8(5); // Unsigned, start 40, factor 1
    const sigSpeed = buffer.readUInt8(6); // Unsigned, start 48, factor 1
    const sigDriveMode = extractBits(buffer, 56, 3); // Unsigned, start 56, 3 bits

    return {
      messageType: "Controller Parameters",
      controllerTemperature: sigControllerTemperature,
      motorTemperature: sigMotorTemperature,
      rmsCurrent: sigRMSCurrent,
      throttle: sigThrottle,
      brake: sigBrake,
      speed: sigSpeed,
      driveMode: sigDriveMode,
    };
  };

  const parseMsgMCU2 = (buffer: Buffer) => {
    const sigMotorRPM = buffer.readUInt16LE(0); // 0|16@1+ (1,0)
  const sigCapacitorVoltage = buffer.readUInt16LE(2); // 16|16@1+ (0.1,0)
  const sigOdometer = buffer.readUInt32LE(4) * 0.1; // 32|32@1+ (0.1,0)

    return {
      messageType: "Motor Parameters",
      motorRPM: sigMotorRPM,
      capacitorVoltage: sigCapacitorVoltage,
      odometer: sigOdometer,
    };
  };

  const parseMsgMCU3 = (buffer: Buffer) => {
    const faults: string[] = [];
    const signals = [
      { name: "sigFltControllerFault", startBit: 0, size: 1 },
      { name: "sigFltControllerOverCurrent", startBit: 1, size: 1 },
      { name: "sigFltCurrentSensor", startBit: 2, size: 1 },
      { name: "sigFltControllerCapacitorOvertemp", startBit: 4, size: 1 },
      { name: "sigFltControllerIGBTOvertemp", startBit: 5, size: 1 },
      { name: "sigFltSevereBPosUndervoltage", startBit: 6, size: 1 },
      { name: "sigFltSevereBPosOvervoltage", startBit: 8, size: 1 },
      { name: "sigFltControllerOvertempCutback", startBit: 10, size: 1 },
      { name: "sigFltBPosUndervoltageCutback", startBit: 11, size: 1 },
      { name: "sigFltBPosOvervoltageCutback", startBit: 12, size: 1 },
      { name: "sigFlt5VSupplyFailure", startBit: 13, size: 1 },
      { name: "sigFltMotorHotCutback", startBit: 14, size: 1 },
      { name: "sigFltThrottlewiperHigh", startBit: 21, size: 1 },
      { name: "sigFltThrottlewiperLow", startBit: 22, size: 1 },
      { name: "sigFltEEPROMFailure", startBit: 23, size: 1 },
      { name: "sigFltEncoder", startBit: 27, size: 1 },
    ];
    signals.forEach((s) => {
      if (extractBits(buffer, s.startBit, s.size)) faults.push(s.name);
    });

    
    return {
      messageType: "Controller Faults",
      faultMessages: faults.length ? faults : ["No Faults Detected"],
    };
  };

  const parseGPIOMsg = (buffer: Buffer) => {
  if (buffer.length < 2) {
    console.error("❌ Invalid GPIO payload length:", buffer.length);
    return { error: "Invalid GPIO Data" };
  }

  const high = buffer[0];
  const low = buffer[1];
  const bitfield = (high << 8) | low;

  console.log("🧮 [GPIO] Raw Bytes → High:", high, "Low:", low);
  console.log("🔢 [GPIO] Bitfield (binary):", bitfield.toString(2).padStart(16, '0'));
  console.log("🔍 [GPIO] Decoded States:");

  const pinNames = [
    "REV_OUT", "FWD_OUT", "KEY_OUT", "BRAKE_OUT", "LOWB_OUT", "HIGHB_OUT",
    "LEFT_OUT", "RIGHT_OUT", "SPORTS_OUT", "ECO_OUT", "NEUTRAL_OUT"
  ];

  const states: { [key: string]: boolean } = {};
  pinNames.forEach((name, index) => {
    const isActive = (bitfield & (1 << index)) !== 0;
    states[name] = isActive;
    console.log(`➡️  ${name}: ${isActive ? "ON ✅" : "OFF ❌"}`);
  });

  return { messageType: "GPIO", states };
};

  return (
    <BatteryBluetoothContext.Provider value={{ connectedDevice, connectToDevice, disconnectDevice, data }}>
      {children}
    </BatteryBluetoothContext.Provider>
  );
};