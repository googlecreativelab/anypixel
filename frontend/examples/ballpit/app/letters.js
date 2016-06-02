/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

var colors = require('./colors'),
    c      = colors.list;


/**
 * This file describes the appearance of each letter in the google logo,
 * it declares the spacing of each link on the constraint (rope) chain
 * and each of the shapes on the letter
 */
var blue   = colors.toCSS(c[0]),
    red    = colors.toCSS(c[3]),
    yell   = colors.toCSS(c[2]),
    green  = colors.toCSS(c[1]),
    startX = 43;

var baseGetY = (i, n)=> 7 + i;

var pX = (i)=>
    ()=>startX + 4 + (10*i);

module.exports = [

    //0 - G
    {
        links: 16,
        getX: ()=> startX,
        getY: (i,n)=>baseGetY(i,n) - 5,

        shapes: [
            {
                radius: 8,
                color: blue
            }
        ]
    },
    //1 - o
    {
        links: 16,
        getX: pX(1),
        getY: baseGetY,

        shapes: [
            {
                radius: 4,
                color: red
            }
        ]
    },
    //2 - o
    {
        links: 16,
        getX: pX(2),
        getY: baseGetY,

        shapes: [
            {
                radius: 4,
                color: yell
            }
        ]
    },
    //3 - g
    {
        links: 16,
        getX: pX(3),
        //drop the last one further, because the one above it is larger
        //than normal
        getY: (i,n)=>baseGetY(i,n) + (i==n-1 ? 9 : 0),

        shapes: [
            //top
            {
                radius: 4,
                color: blue,
                position: [0, 0]
            },
            //bottom
            {
                radius: 4,
                color: blue,
                position: [0, 1]
            }
        ]
    },
    //4 - l
    {
        links: 16,
        getX: pX(4),
        getY: (i,n)=>(baseGetY(i,n)-9) + (i==n-1 ? 9 : 0),

        shapes: [
            //top
            {
                radius: 4,
                color: green
            },
            //bottom
            {
                radius: 4,
                color: green
            }
        ]
    },
    //5 - e
    {
        links: 16,
        getX: pX(5),
        getY: baseGetY,

        shapes: [
            {
                radius: 4,
                color: red
            }
        ]
    }
];
