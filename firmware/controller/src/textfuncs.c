/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "textfuncs.h"

int TEXT_strcpy(uint8_t *buf, const char *inStr) {
	int i = 0;
	while(inStr[i] != 0) {
		buf[i] = inStr[i];
		i++;
	}
	return i;
}

int TEXT_strncmp(uint8_t *buf, const char *inStr, uint16_t num) {
	int i;
	int retval;
	for(i = 0; i < num; i++) {
		retval = buf[i] - inStr[i];
		if(retval != 0)
			return retval;
	}
	return 0;
}

/**
 * In place deletion of whitespace characters
 * \param buf The buffer to work on
 * \param len The number of characters to look at
 * \return The number of whitespace characters removed
 */
uint16_t TEXT_deleteWhiteSpace(uint8_t *buf, uint16_t len) {
	int whiteSpaceCount=0;
	int i;
	// remove all whitespace
	for(i = 0; i < len; i++) {
		if(buf[i] == ' ' || buf[i] == '\t' || buf[i] == '\r' || buf[i] == '\n')
			whiteSpaceCount++;
		else
			buf[i-whiteSpaceCount] = buf[i];
	}
	return whiteSpaceCount;
}

uint16_t TEXT_numToString(uint8_t *buf, int32_t value, int16_t bufSize, uint8_t minLen, uint8_t padChar, bool padBeforeSign) {
	uint8_t work[11];
	uint8_t count = 0;
	bool negative = false;
	uint8_t i;

	if(minLen > bufSize || minLen > 11)
		return 0;

	if(value < 0) {
		negative = true;
		value *= -1;
	}

	do {
		work[count++] = (value % 10) + '0';
		value /= 10;
	} while(value != 0);

	if(negative) {
		if(count+1 > bufSize)
			return 0;
		if(!padBeforeSign) {
			while( count < (minLen-1) )
				work[count++] = padChar;
			work[count++] = '-';
		} else {
			work[count++] = '-';
		}
	}

	while( count < minLen )
		work[count++] = padChar;

	if(count > bufSize)
		return 0;

	for( i = 0; i < count; i++)
		buf[i] = work[count-1-i];

	return count;
}

uint8_t TEXT_parseInt(uint8_t *buf, int *result) {
	uint8_t offset = 0;
	bool negative = false;
	if(buf[0] == '-') {
		negative = true;
		offset++;
	}
	*result = 0;
	while(buf[offset] >= '0' && buf[offset] <= '9') {
		*result *= 10;
		*result += buf[offset++] - '0';
	}
	if(negative)
		*result *= -1;
	return offset;
}


uint8_t num2hex[] = {'0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'};

uint16_t TEXT_numToHexString(uint8_t *buf, uint32_t value, int16_t bufSize, uint8_t minLen, uint8_t padChar) {
	uint8_t work[10];
	uint8_t count = 0;
	uint8_t i;

	if(minLen > bufSize || minLen > 10)
		return 0;

	do {
		work[count++] = num2hex[ value & 0xF ];
		value >>= 4;
	} while(value != 0);

	if(count > bufSize)
		return 0;

	while( count < minLen )
		work[count++] = padChar;

	for( i = 0; i < count; i++)
		buf[i] = work[count-1-i];

	return count;
}
