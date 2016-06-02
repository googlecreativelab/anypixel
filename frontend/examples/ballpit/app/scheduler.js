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

var animitter = require('animitter');

/**
 * scheduler is an interruptible timer
 * that broadcasts its state through `start` and `complete` events
 * set a `cycleWait` for how long to wait in-between cycles
 * and a `cycleDuration` for how long each cycle should last
 * then start it, reset it to use it again
 *
 * other modules building on top of scheduler can customize `shouldCycle()`
 * and `shouldStop()` to create custom conditions for its cycles
 */
function makeScheduler(params){
    var exp = animitter.bound();

    Object.assign(exp, {
        lastCycleMs   : Date.now(),
        cycleWait     : 10000,
        cycleDuration : 5000
    }, params);

    exp.set = (params)=>Object.assign(exp, params);

    /**
     * set now as the time of the last cycle (start the timer over)
     * @return {Number} now
     */
    exp.clearCycle = ()=>(exp.lastCycleMs = Date.now());

    /**
     * should the scheduler announce its completion?
     * @return {Boolean} true if its done
     */
    exp.shouldStop = ()=>
        Date.now() - exp.lastCycleMs > exp.cycleDuration;

    /**
     * should the scheduler be started?
     * @return {Boolean}
     */
    exp.shouldCycle = ()=>
        !exp.isRunning() && Date.now() - exp.lastCycleMs > exp.cycleWait;

    exp
        .on('start', exp.clearCycle)
        .on('update', ()=>exp.shouldStop() && exp.complete())
        .on('stop', exp.clearCycle)


    return exp;
}

module.exports = makeScheduler;

