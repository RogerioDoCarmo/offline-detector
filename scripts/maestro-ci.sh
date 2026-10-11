#!/usr/bin/env sh
# Runs the Maestro flows inside the emulator-runner step and, pass or fail, leaves what a failure
# needs in the workspace so the workflow can upload it:
#
#   maestro-report.xml        junit result
#   maestro-logcat.txt        the device log of the whole run
#   maestro-focus.txt         which window had focus (an Android dialog over the app shows here)
#   maestro-final-screen.png  the screen as the run ended
#   maestro-debug/            Maestro's own output: per-flow logs and failure screenshots
#
# The flows fail intermittently with the app not showing its first screen; before this, CI kept only
# the junit file and the cause could not be read. The exit code is Maestro's own, so a failing flow
# still fails the job.

adb logcat -c || true

maestro test apps/demo-native/.maestro --format junit --output maestro-report.xml
code=$?

adb logcat -d -v time > maestro-logcat.txt || true
adb shell dumpsys window windows | grep -E "mCurrentFocus|mFocusedApp" > maestro-focus.txt || true
adb exec-out screencap -p > maestro-final-screen.png || true
cp -r "$HOME/.maestro/tests" maestro-debug 2>/dev/null || true

exit "$code"
