
const colors = [
    [31, 32, 36],
    [86, 20, 18],
    [52, 60, 0],
    [71, 54, 0],
    [15, 54, 82],
    [83, 21, 51],
    [17, 63, 60],
    [255, 255, 255]
]

const escapeChar = ""

window.onload = () => {
    const formId = "form"
    const form = document.getElementById(formId) as HTMLFormElement
    if (form == null) {
        throw new Error(`Element ${formId} not found`)
    }

    const usernameInputId = "usernameInput"
    const usernameInput = document.getElementById(usernameInputId) as HTMLInputElement
    if (usernameInput == null) {
        throw new Error(`Element ${usernameInputId} not found`)
    }

    const outputFieldId = "outputField"
    const outputField = document.getElementById(outputFieldId) as HTMLTextAreaElement
    if (outputField == null) {
        throw new Error(`Element ${outputFieldId} not found`)
    }

    const copyButtonId = "copyButton"
    const copyButton = document.getElementById("copyButton") as HTMLButtonElement
    if (copyButton == null) {
        throw new Error(`Element ${copyButtonId} not found`)
    }

    const previewCanvasId = "previewCanvas"
    const previewCanvas = document.getElementById(previewCanvasId) as HTMLCanvasElement
    if (previewCanvas == null) {
        throw new Error(`Element ${previewCanvasId} not found`)
    }
    previewCanvas.width = 64
    previewCanvas.height = 64
    const previewContext = previewCanvas.getContext("2d")
    if (previewContext == null) {
        throw new Error("Error initializing Preview Canvas")
    }

    form.onsubmit = (e) => {
        e.preventDefault()
        const url = `https://mc-heads.net/avatar/${usernameInput.value}`
        getPixels(url, (pixels) => {
            const textColors = pixelsToTextColors(pixels)
            outputField.innerText = textColorsToAnsiString(textColors)
            drawPreview(previewContext, textColors)
        })
    }

    copyButton.onclick = () => {
        navigator.clipboard.writeText(outputField.innerText)
    }
}

const drawPreview = (context: CanvasRenderingContext2D, textColors: number[]) => {
    textColors.forEach((color, i) => {
        const x = i % 8
        const y = Math.floor(i / 8)
        const r = colors[color][0]
        const g = colors[color][1]
        const b = colors[color][2]
        context.fillStyle = `rgb(${r}, ${g}, ${b})`
        context.fillRect(x * 8, y * 8, 8, 8)
    })
}

const pixelsToTextColors = (pixels: Uint8Array): number[] => {
    const textColors = []

    for (let i = 0; i < pixels.length; i += 4) {
        const pixelColor = [pixels[i], pixels[i + 1], pixels[i + 2]]
        let nearestColorDifference = getDifference(colors[0], pixelColor)
        let nearestColorIndex = 0
        colors.forEach((color, index) => {
            const difference = getDifference(color, pixelColor)
            if (difference < nearestColorDifference) {
                nearestColorDifference = difference
                nearestColorIndex = index
            }
        })
        textColors.push(nearestColorIndex)
    }
    return textColors
}

const textColorsToAnsiString = (textColors: number[]): string => {
    let string = "> ```ansi\n> "
    textColors.forEach((color, i) => {
        string += `${escapeChar}[0;${color + 30}m██`
        if ((i + 1) % 8 == 0) {
            string += "\n> "
        }
    })
    string += "```"
    return string
}

const getDifference = (color1: number[], color2: number[]): number => {
    // https://www.compuphase.com/cmetric.htm
    const rmean = (color1[0] + color2[0]) / 2
    const r = color1[0] - color2[0]
    const g = color1[1] - color2[1]
    const b = color1[2] - color2[2]
    return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}

const getPixels = (url: string, callback: (pixels: any) => void) => {
    const image = new Image()
    image.crossOrigin = "Anonymous"
    image.src = url
    image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 8
        canvas.height = 8

        const context = canvas.getContext("2d")
        context?.drawImage(image, 0, 0, 8, 8)
        const pixels = context?.getImageData(0, 0, canvas.width, canvas.height).data
        if (pixels == undefined) {
            throw new Error("Error loading image")
        }
        callback(new Uint8Array(pixels))
    }
}

