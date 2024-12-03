// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import QtQuick

// [default] [required] [readonly] property <propertyType> <propertyName>
// https://doc.qt.io/qt-6/qtqml-syntax-objectattributes.html

Window {
    // qml types
    property int height: 0
    property int height : 0
    property string name: "abcd"
    property color color: "#121212" // comment
    property point value: Qt.point(1, 2)
    property list<int> value: [1, 2, 3, 4]

    // default
    default property var someText

    // required
    Component {
        id: _delegate

        Item {
            required property int point
            required property string name
            required property list<int> value
        }
    }

    // readonly
    readonly property color myvalue: Qt.rgba(1, 1, 1, 1)
    readonly property list<int> value: [1, 2, 3, 4]

    // alias
    property alias text: _text.text

    // without initial value
    property color nextColor
    property list<int> value

    // props in child object
    Rectangle {
        property int animatedHeight: 0
        property string name: "abcd"

        width: 100
        height: 100
        gradient: Gradient {
            GradientStop { position: 0.0; color: "yellow" }
            GradientStop { position: 1.0; color: "green" }
        }

        opacity: 1.0

        Rectangle {
            id: child
        }
    }

    // make property to a required one
    Rectangle {
        required color
    }

    // others
    property list<int> value: [
        1, 2, 3, 4
    ]

    property Model value1: Model { }
    property Model value2: Model { }
}
