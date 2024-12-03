// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import QtQuick

Rectangle {
    id: _rect

    // without parameters
    signal pressed
    signal pressed()
    signal pressed() // comment

    // signal with parameters
    signal clickedAt(x: real, y: real)
    signal clickedAt(real x, real y) // old style
}
