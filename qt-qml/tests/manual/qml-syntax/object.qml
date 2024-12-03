// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import QtQuick as MyModule

Window {
    width: 640
    height : 480

     // single line
    Rectangle { width: 100; height: 100 }

    // multiple lines
    Rectangle {
        width: 100
        height: 100
    }

    Rectangle
    {
        width: 100
        height: 100
    }

    // nesting
    Rectangle {
        width: 100
        height: 100

        Text {
            width: 100
            height: 100
        }
    }

    // object as prop. value
    Rectangle {
        width: 100
        height: 100
        gradient: Gradient {
            GradientStop { position: 0.0; color: "yellow" }
            GradientStop { position: 1.0; color: "green" }
        }
    }

    // object within namespace
    MyModule.Text {
        text: "Hello from my custom text item!"
    }
}
