'''
/**
 * Copyright 2016 Anders Hoff. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/license-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the license.
 */
'''

#!/usr/bin/python

import Image


def main():
  w = 140
  h = 42
  counter = 0

  im = Image.open('../images/logo.png')
  pix = im.load()

  resxy = []
  resk = []

  for x in xrange(w):
    for y in xrange(h):
      if pix[x,y][-1]<1:
        resxy.append((x,y))
        resk.append(y*w+x)
        counter += 1


  with open('logo2.txt', 'w') as f:
    for k in sorted(resk):
      f.write('{:d}, '.format(k))

  print('counter', counter)

if __name__ == '__main__':

  main()

