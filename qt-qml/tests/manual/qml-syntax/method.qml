// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import QtQuick

Item {
    function myfunc() { return 3; } // comment
    function myfunc() { // comment
        // comment
        return 3;
    }

    function myfunc(): int {
        return 3;
    }

    function myfunc(): int {
        return 3;
    }

    function myfunc(a: int, b: date, c: Item): int {
        return a + b + c.prop;
    }

    // arrow function
    Component.onCompleted: () => {
        console.log("aaa");
    }

    Keys.onPressed: (event)=> {
        if (event.key == Qt.Key_Left) {
            console.log("move left");
            event.accepted = true;
        }
    }

    // inside child item
    MouseArea {
        function insideItem(a: int, b: date): int {
            return a + b;
        }

        // arrow function
        onClicked: (e) => {
            console.log("clicked", e);
            insideItem(a, b)
        }

        // without (), {}
        onPressed: mouse => root.activated(mouse.x, mouse.y)
    }
}
