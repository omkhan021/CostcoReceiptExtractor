import React, {useMemo} from 'react';
import {View, Dimensions} from 'react-native';

// Code 128 bar patterns — 11 binary digits each (Stop is 13).
// 1 = bar (black), 0 = space (white).
// Indices 0-102: data symbols; 103=StartA, 104=StartB, 105=StartC, 106=Stop.
const P: readonly string[] = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', //  0- 4
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000', //  5- 9
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110', // 10-14
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100', // 15-19
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100', // 20-24
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010', // 25-29
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', // 30-34
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000', // 35-39
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110', // 40-44
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110', // 45-49
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000', // 50-54
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010', // 55-59
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100', // 60-64
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000', // 65-69
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010', // 70-74
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010', // 75-79
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100', // 80-84
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110', // 85-89
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110', // 90-94
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110', // 95-99
  '10111101110', '11101011110', '11110101110', '11010000100', '11010010000', // 100-104
  '11010011100', '1100011101011',                                            // 105-106
];

const START_B = 104;
const START_C = 105;
const STOP    = 106;

// Code 128C: pairs of digits → 2x more compact for numeric strings.
function encodeC(text: string): string | null {
  if (text.length % 2 !== 0 || !/^\d+$/.test(text)) {
    return null;
  }
  const vals = [START_C];
  for (let i = 0; i < text.length; i += 2) {
    vals.push(parseInt(text.slice(i, i + 2), 10));
  }
  let check = START_C;
  for (let i = 1; i < vals.length; i++) {
    check += i * vals[i];
  }
  vals.push(check % 103, STOP);
  return vals.map(v => P[v]).join('');
}

// Code 128B: handles any printable ASCII (32–126).
function encodeB(text: string): string | null {
  const vals = [START_B];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) {
      return null;
    }
    vals.push(code - 32);
  }
  let check = START_B;
  for (let i = 1; i < vals.length; i++) {
    check += i * vals[i];
  }
  vals.push(check % 103, STOP);
  return vals.map(v => P[v]).join('');
}

const QUIET_MODULES = 10;
const WIDTH_FRACTION = 0.8;

interface Props {
  value: string;
  height?: number;
  color?: string;
  background?: string;
}

export default function Barcode({
  value,
  height = 80,
  color = '#000000',
  background = '#ffffff',
}: Props) {
  const bits = useMemo(() => encodeC(value) ?? encodeB(value), [value]);

  if (!bits) {
    return null;
  }

  const targetWidth = Dimensions.get('window').width * WIDTH_FRACTION;
  const totalModules = bits.length + QUIET_MODULES * 2;
  const moduleWidth = targetWidth / totalModules;
  const quiet = moduleWidth * QUIET_MODULES;

  return (
    <View style={{width: targetWidth, flexDirection: 'row', backgroundColor: background, paddingHorizontal: quiet}}>
      {bits.split('').map((bit, i) => (
        <View
          key={i}
          style={{width: moduleWidth, height, backgroundColor: bit === '1' ? color : background}}
        />
      ))}
    </View>
  );
}
