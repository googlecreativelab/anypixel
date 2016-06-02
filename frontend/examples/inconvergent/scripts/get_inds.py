#!/usr/bin/python

# copyright 2016 google inc.

# licensed under the apache license, version 2.0 (the "license");
# you may not use this file except in compliance with the license.
# you may obtain a copy of the license at

#    http://www.apache.org/licenses/license-2.0

# unless required by applicable law or agreed to in writing, software
# distributed under the license is distributed on an "as is" basis,
# without warranties or conditions of any kind, either express or implied.
# see the license for the specific language governing permissions and
# limitations under the license.

try:
  import Image
except:
  from PIL import Image


def main():

  '''
  Utility script used to read a png image and return the indices of the black
  pixels in that image.

  Output is written as indices to a file named 'out', and image is read from
  image path in variable 'logo'.

  '''

  out = 'logo.txt'
  logo = 'logo.png'

  im = Image.open(logo)
  pix = im.load()
  w, h = im.size

  resxy = []
  resk = []
  counter = 0

  for x in xrange(w):
    for y in xrange(h):
      if pix[x,y][-1]<1:
        resxy.append((x,y))
        resk.append(y*w+x)
        counter += 1

  with open(out, 'w') as f:
    for k in sorted(resk):
      f.write('{:d}, '.format(k))

  print('output indices', counter)
  print('total indices', w*h)

if __name__ == '__main__':

  main()

