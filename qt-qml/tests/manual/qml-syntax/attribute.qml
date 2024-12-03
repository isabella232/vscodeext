// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

Rectangle {
    // object case
    gradient: Gradient {
        GradientStop { position: 0.0; color: "yellow" }
        GradientStop { position: 1.0; color: "green" }
    }

    // list of objects
    children: [
        Item { value: 1 },
        Item { value: 2 },
        T.Item { value: 3 }
    ]

    // list of js expressions
    values: [
        1, 2, 3, 4,
        2*20, Math.PI, calc(20)
    ]

    // js block
    width: { return 100; }
    width: {
        const val = 3;
        const result = val * 2;

        // comment
        return result / Math.PI;
    }

    // js expression
    width: 100 * 2;
    width: height / 2
    width: 100
    width: 100;
    width: 100; height: 200
    width: 100; height: 200;
    color: "red"
    color: Qt.rgba(100, 100, 100, 100)
    opacity: 1.2
    visible: true
    visible: false
    values: [1, 2, 3, 4]

    // group
    anchors.fill: parent
    anchors {
        left: other.right // comment
        right: parent.right
        // comment
        top: parent.top
    }

    // multi-line
    color: Qt.rgba(
        100,
        100,
        100,
        Math.random()
    )
}
