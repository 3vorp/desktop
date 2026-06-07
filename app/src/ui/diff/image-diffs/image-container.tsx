import * as React from 'react'

import { Image } from '../../../models/diff'
import { convertDDSImage } from './dds-converter'

/**
 * This number is technically arbitrary, but images larger than this tend to
 * look worse pixelated than smoothened out.
 */
const ImagePixelationThreshold = 64

interface IImageProps {
  /** The image contents to render */
  readonly image: Image

  /** Optional styles to apply to the image container */
  readonly style?: React.CSSProperties

  /** callback to fire after the image has been loaded */
  readonly onElementLoad?: (img: HTMLImageElement) => void
}

interface IImageState {
  readonly imageSource: string | null
}

export class ImageContainer extends React.Component<IImageProps, IImageState> {
  public constructor(props: IImageProps) {
    super(props)
    this.state = {
      imageSource: null,
    }
  }

  public loadImage(image: Image) {
    if (image.mediaType === 'image/vnd-ms.dds') {
      try {
        const dataURL = convertDDSImage(image.rawContents)
        this.setState({
          imageSource: dataURL,
        })
      } catch (error) {
        console.error('Error loading DDS image:', error)
        this.setState({ imageSource: null })
      }
    } else {
      this.setState({
        imageSource: `data:${image.mediaType};base64,${image.contents}`,
      })
    }
  }

  private isDimensionPixelated(
    dim: React.CSSProperties['maxWidth'] | React.CSSProperties['maxHeight']
  ): boolean {
    return dim !== undefined && Number(dim) <= ImagePixelationThreshold
  }

  private getImageRenderingMethod(): 'pixelated' | 'auto' {
    if (!this.props.style) {
      return 'auto'
    }
    const { maxWidth, maxHeight } = this.props.style
    if (
      this.isDimensionPixelated(maxHeight) ||
      this.isDimensionPixelated(maxWidth)
    ) {
      return 'pixelated'
    }
    return 'auto'
  }

  public componentDidMount() {
    const { image } = this.props
    this.loadImage(image)
  }

  public componentDidUpdate(prevProps: IImageProps) {
    const { image } = this.props
    if (image === prevProps.image) {
      return
    }

    this.loadImage(image)
  }

  public render() {
    const { imageSource } = this.state
    if (!imageSource) {
      return null
    }

    return (
      <div className="image-wrapper">
        <img
          src={imageSource}
          alt=""
          onLoad={this.onLoad}
          style={{
            ...this.props.style,
            imageRendering: this.getImageRenderingMethod(),
          }}
        />
      </div>
    )
  }

  private onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (this.props.onElementLoad) {
      this.props.onElementLoad(e.currentTarget)
    }
  }
}
