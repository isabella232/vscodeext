// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

// enum
Text {
    enumm TextType {
        Normal,
        Heading = 2,
        Contents
    }

    property int textType: MyText.TextType.Normal

    font.bold: textType === MyText.TextType.Heading
    font.pixelSize: textType === MyText.TextType.Heading ? 24 : 12
}

// inline component
Window {
    width: 300
    height: 200
    visible: true

    PushButtonInline { x: 50; y: 20 }
    PushButtonInline { x: 50; y: 100 }

    component PushButtonInline: Rectangle {
        id: _rect
        color: "skyblue"
        border.color: "lightgray"
        implicitWidth: 150
        implicitHeight: 60
    }
}

// attached prop
ListView {
    delegate: Item {
        id: _delegate
        width: 100; height: 30

        Rectangle {
            width: 100; height: 30
            color: _delegate.ListView.isCurrentItem ? "red" : "yellow" // correct
        }
    }
}

// string
Item {
    prop1: "value1"
    prop2: 'value2'
    prop3: `${prop1} abcd` + `this is a ${prop2} value.`

    Component.onCompleted: {
        // single line
        console.log("string text line ");
        console.log('string text line ');
        console.log(`string text line with ${a+b} and ${prop1}.`);

        // multiple line
        console.log(`string text line with ${a+b} and ${prop1}.
            the second line`);
    }
}

// comment
// This is a line comment

Item { // This is a comment
}

/*
  This is a block comment
*/

/*!
  This is a block comment
*/

// some helpers for user convenience
Item {
  // NOTE note entry
  // TODO todo entry
  // DEBUG debug entry
  // XXX xxx entry
  // BUG bug entry
  // FIXME fixme entry
  // WARNING warning entry
}
