import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	Button,
	Notice,
	ToolbarGroup,
	ToolbarDropdownMenu,
	DatePicker,
	Popover,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';

const SCHEMA_TYPES = [
	{ label: __( 'Product', 'wp-ranked-list-blocks' ), value: 'Product' },
	{ label: __( 'Software Application', 'wp-ranked-list-blocks' ), value: 'SoftwareApplication' },
	{ label: __( 'Platform', 'wp-ranked-list-blocks' ), value: 'Platform' },
	{ label: __( 'Place', 'wp-ranked-list-blocks' ), value: 'Place' },
	{ label: __( 'Local Business', 'wp-ranked-list-blocks' ), value: 'LocalBusiness' },
	{ label: __( 'Restaurant', 'wp-ranked-list-blocks' ), value: 'Restaurant' },
	{ label: __( 'Book', 'wp-ranked-list-blocks' ), value: 'Book' },
	{ label: __( 'Movie', 'wp-ranked-list-blocks' ), value: 'Movie' },
	{ label: __( 'Creative Work', 'wp-ranked-list-blocks' ), value: 'CreativeWork' },
];

const CURRENCY_OPTIONS = [
	{ label: 'GBP (£)', value: 'GBP' },
	{ label: 'USD ($)', value: 'USD' },
	{ label: 'EUR (€)', value: 'EUR' },
];

const PRODUCT_TYPES = [ 'Product', 'SoftwareApplication' ];
const PLACE_TYPES = [ 'Place', 'LocalBusiness', 'Restaurant' ];
const CREATIVE_TYPES = [ 'Book', 'Movie', 'CreativeWork' ];
const PLATFORM_TYPE = 'Platform';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		schemaType,
		title,
		subtitle,
		description,
		url,
		urlButtonText,
		imageUrl,
		imageId,
		imageAlt,
		heroImageUrl,
		heroImageId,
		heroImageAlt,
		price,
		currency,
		ratingValue,
		reviewCount,
		address,
		telephone,
		author,
		datePublished,
		alternateName,
		sameAs,
	} = attributes;

	const [ showDatePopover, setShowDatePopover ] = useState( false );

	// Calculate position based on block order.
	const position = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockName, getBlockRootClientId } =
				select( 'core/block-editor' );
			const rootClientId = getBlockRootClientId( clientId );
			const blockOrder = getBlockOrder( rootClientId );
			let pos = 0;
			for ( const id of blockOrder ) {
				if ( getBlockName( id ) === 'wcg/ranked-list-block' ) {
					pos++;
					if ( id === clientId ) {
						return pos;
					}
				}
			}
			return pos;
		},
		[ clientId ]
	);

	// Validation warnings.
	const warnings = useMemo( () => {
		const w = [];
		if ( ! title ) {
			w.push( __( 'Title is required.', 'wp-ranked-list-blocks' ) );
		}
		if ( url && ! /^https?:\/\/.+/.test( url ) ) {
			w.push(
				__( 'URL must be a valid address starting with http:// or https://.', 'wp-ranked-list-blocks' )
			);
		}
		if ( ratingValue && ( parseFloat( ratingValue ) < 0 || parseFloat( ratingValue ) > 5 ) ) {
			w.push(
				__( 'Rating value must be between 0 and 5.', 'wp-ranked-list-blocks' )
			);
		}
		if ( reviewCount && ( ! Number.isInteger( Number( reviewCount ) ) || Number( reviewCount ) < 0 ) ) {
			w.push(
				__(
					'Review count must be a positive integer.',
					'wp-ranked-list-blocks'
				)
			);
		}
		if ( price && isNaN( parseFloat( price ) ) ) {
			w.push(
				__( 'Price must be a valid number.', 'wp-ranked-list-blocks' )
			);
		}
		return w;
	}, [ title, url, ratingValue, reviewCount, price ] );

	const blockProps = useBlockProps( {
		className: 'ranked-list-item-editor',
	} );

	const isProduct = PRODUCT_TYPES.includes( schemaType );
	const isPlace = PLACE_TYPES.includes( schemaType );
	const isCreative = CREATIVE_TYPES.includes( schemaType );
	const isPlatform = schemaType === PLATFORM_TYPE;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon="tag"
						label={ __( 'Schema Type', 'wp-ranked-list-blocks' ) }
						controls={ SCHEMA_TYPES.map( ( type ) => ( {
							title: type.label,
							isActive: schemaType === type.value,
							onClick: () =>
								setAttributes( { schemaType: type.value } ),
						} ) ) }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody
					title={ __( 'Schema Type', 'wp-ranked-list-blocks' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Type', 'wp-ranked-list-blocks' ) }
						value={ schemaType }
						options={ SCHEMA_TYPES }
						onChange={ ( value ) =>
							setAttributes( { schemaType: value } )
						}
						help={ __(
							'Select the schema.org type for this item.',
							'wp-ranked-list-blocks'
						) }
					/>
				</PanelBody>

				{ isPlatform && (
					<PanelBody
						title={ __( 'Platform (meta)', 'wp-ranked-list-blocks' ) }
						initialOpen={ true }
					>
						<TextControl
							label={ __( 'Alternative Name', 'wp-ranked-list-blocks' ) }
							value={ alternateName }
							onChange={ ( value ) =>
								setAttributes( { alternateName: value } )
							}
							help={ __(
								'Optional. Schema.org alternateName.',
								'wp-ranked-list-blocks'
							) }
						/>
						<TextControl
							label={ __( 'Same As', 'wp-ranked-list-blocks' ) }
							value={ sameAs }
							onChange={ ( value ) =>
								setAttributes( { sameAs: value } )
							}
							placeholder="https://…"
							help={ __(
								'Optional. One or more URLs, comma-separated. Schema.org sameAs.',
								'wp-ranked-list-blocks'
							) }
						/>
					</PanelBody>
				) }

				{ isProduct && (
					<PanelBody
						title={ __( 'Product Details', 'wp-ranked-list-blocks' ) }
						initialOpen={ true }
					>
						<TextControl
							label={ __( 'Price', 'wp-ranked-list-blocks' ) }
							value={ price }
							onChange={ ( value ) =>
								setAttributes( { price: value } )
							}
							type="number"
							step="0.01"
							min="0"
							help={ __(
								'Product price value.',
								'wp-ranked-list-blocks'
							) }
						/>
						<SelectControl
							label={ __( 'Currency', 'wp-ranked-list-blocks' ) }
							value={ currency }
							options={ CURRENCY_OPTIONS }
							onChange={ ( value ) =>
								setAttributes( { currency: value } )
							}
						/>
						<TextControl
							label={ __( 'Rating Value', 'wp-ranked-list-blocks' ) }
							value={ ratingValue }
							onChange={ ( value ) =>
								setAttributes( { ratingValue: value } )
							}
							type="number"
							step="0.1"
							min="0"
							max="5"
							help={ __(
								'Rating between 0 and 5.',
								'wp-ranked-list-blocks'
							) }
						/>
						<TextControl
							label={ __( 'Review Count', 'wp-ranked-list-blocks' ) }
							value={ reviewCount }
							onChange={ ( value ) =>
								setAttributes( { reviewCount: value } )
							}
							type="number"
							min="0"
							step="1"
							help={ __(
								'Total number of reviews.',
								'wp-ranked-list-blocks'
							) }
						/>
					</PanelBody>
				) }

				{ isPlace && (
					<PanelBody
						title={ __( 'Location Details', 'wp-ranked-list-blocks' ) }
						initialOpen={ true }
					>
						<TextControl
							label={ __( 'Address', 'wp-ranked-list-blocks' ) }
							value={ address }
							onChange={ ( value ) =>
								setAttributes( { address: value } )
							}
							help={ __(
								'Full street address.',
								'wp-ranked-list-blocks'
							) }
						/>
						<TextControl
							label={ __( 'Telephone', 'wp-ranked-list-blocks' ) }
							value={ telephone }
							onChange={ ( value ) =>
								setAttributes( { telephone: value } )
							}
							help={ __(
								'Contact phone number.',
								'wp-ranked-list-blocks'
							) }
						/>
						<TextControl
							label={ __( 'Rating Value', 'wp-ranked-list-blocks' ) }
							value={ ratingValue }
							onChange={ ( value ) =>
								setAttributes( { ratingValue: value } )
							}
							type="number"
							step="0.1"
							min="0"
							max="5"
							help={ __(
								'Rating between 0 and 5.',
								'wp-ranked-list-blocks'
							) }
						/>
						<TextControl
							label={ __( 'Review Count', 'wp-ranked-list-blocks' ) }
							value={ reviewCount }
							onChange={ ( value ) =>
								setAttributes( { reviewCount: value } )
							}
							type="number"
							min="0"
							step="1"
							help={ __(
								'Total number of reviews.',
								'wp-ranked-list-blocks'
							) }
						/>
					</PanelBody>
				) }

				{ isCreative && (
					<PanelBody
						title={ __(
							'Creative Work Details',
							'wp-ranked-list-blocks'
						) }
						initialOpen={ true }
					>
						<TextControl
							label={ __( 'Author / Creator', 'wp-ranked-list-blocks' ) }
							value={ author }
							onChange={ ( value ) =>
								setAttributes( { author: value } )
							}
							help={ __(
								'Name of the author or creator.',
								'wp-ranked-list-blocks'
							) }
						/>
						<div className="ranked-list-item-date-field">
							<TextControl
								label={ __(
									'Date Published',
									'wp-ranked-list-blocks'
								) }
								value={ datePublished }
								onChange={ ( value ) =>
									setAttributes( { datePublished: value } )
								}
								help={ __(
									'Publication date (YYYY-MM-DD).',
									'wp-ranked-list-blocks'
								) }
								placeholder="YYYY-MM-DD"
							/>
							<Button
								variant="secondary"
								onClick={ () =>
									setShowDatePopover( ! showDatePopover )
								}
								size="small"
							>
								{ __( 'Pick date', 'wp-ranked-list-blocks' ) }
							</Button>
							{ showDatePopover && (
								<Popover
									onClose={ () =>
										setShowDatePopover( false )
									}
								>
									<DatePicker
										currentDate={ datePublished || undefined }
										onChange={ ( value ) => {
											setAttributes( {
												datePublished:
													value.split( 'T' )[ 0 ],
											} );
											setShowDatePopover( false );
										} }
									/>
								</Popover>
							) }
						</div>
						<TextControl
							label={ __( 'Rating Value', 'wp-ranked-list-blocks' ) }
							value={ ratingValue }
							onChange={ ( value ) =>
								setAttributes( { ratingValue: value } )
							}
							type="number"
							step="0.1"
							min="0"
							max="5"
							help={ __(
								'Rating between 0 and 5.',
								'wp-ranked-list-blocks'
							) }
						/>
						<TextControl
							label={ __( 'Review Count', 'wp-ranked-list-blocks' ) }
							value={ reviewCount }
							onChange={ ( value ) =>
								setAttributes( { reviewCount: value } )
							}
							type="number"
							min="0"
							step="1"
							help={ __(
								'Total number of reviews.',
								'wp-ranked-list-blocks'
							) }
						/>
					</PanelBody>
				) }
			</InspectorControls>

			<div { ...blockProps }>
				<div className="ranked-list-item-editor__position">
					{ position }
				</div>
				<span className="ranked-list-item-editor__badge">
					{ schemaType }
				</span>

				{ warnings.length > 0 && (
					<div className="ranked-list-item-editor__warnings">
						{ warnings.map( ( warning, i ) => (
							<Notice
								key={ i }
								status="warning"
								isDismissible={ false }
							>
								{ warning }
							</Notice>
						) ) }
					</div>
				) }

				<div className="ranked-list-item-editor__hero">
					<label className="components-base-control__label">
						{ __( 'Image (optional, full width)', 'wp-ranked-list-blocks' ) }
					</label>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ ( media ) =>
								setAttributes( {
									heroImageUrl: media.url,
									heroImageId: media.id,
									heroImageAlt: media.alt || '',
								} )
							}
							allowedTypes={ [ 'image' ] }
							value={ heroImageId }
							render={ ( { open } ) =>
								heroImageUrl ? (
									<div className="ranked-list-item-editor__image-preview">
										<img src={ heroImageUrl } alt={ heroImageAlt } />
										<div className="ranked-list-item-editor__image-actions">
											<Button
												variant="secondary"
												onClick={ open }
												size="small"
											>
												{ __( 'Replace', 'wp-ranked-list-blocks' ) }
											</Button>
											<Button
												variant="tertiary"
												isDestructive
												onClick={ () =>
													setAttributes( {
														heroImageUrl: '',
														heroImageId: 0,
														heroImageAlt: '',
													} )
												}
												size="small"
											>
												{ __( 'Remove', 'wp-ranked-list-blocks' ) }
											</Button>
										</div>
									</div>
								) : (
									<Button variant="secondary" onClick={ open } size="small">
										{ __( 'Select image', 'wp-ranked-list-blocks' ) }
									</Button>
								)
							}
						/>
					</MediaUploadCheck>
				</div>

				<div className="ranked-list-item-editor__image">
					<label className="components-base-control__label">
						{ __( 'Logo', 'wp-ranked-list-blocks' ) }
					</label>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ ( media ) =>
								setAttributes( {
									imageUrl: media.url,
									imageId: media.id,
									imageAlt: media.alt || '',
								} )
							}
							allowedTypes={ [ 'image' ] }
							value={ imageId }
							render={ ( { open } ) =>
								imageUrl ? (
									<div className="ranked-list-item-editor__image-preview">
										<img src={ imageUrl } alt={ imageAlt } />
										<div className="ranked-list-item-editor__image-actions">
											<Button
												variant="secondary"
												onClick={ open }
												size="small"
											>
												{ __(
													'Replace',
													'wp-ranked-list-blocks'
												) }
											</Button>
											<Button
												variant="tertiary"
												isDestructive
												onClick={ () =>
													setAttributes( {
														imageUrl: '',
														imageId: 0,
														imageAlt: '',
													} )
												}
												size="small"
											>
												{ __(
													'Remove',
													'wp-ranked-list-blocks'
												) }
											</Button>
										</div>
									</div>
								) : (
									<Button
										variant="secondary"
										onClick={ open }
										size="small"
									>
										{ __(
											'Upload Logo',
											'wp-ranked-list-blocks'
										) }
									</Button>
								)
							}
						/>
					</MediaUploadCheck>
				</div>

				<div className="ranked-list-item-editor__fields">
					<TextControl
						label={ __( 'Title', 'wp-ranked-list-blocks' ) }
						value={ title }
						onChange={ ( value ) =>
							setAttributes( { title: value } )
						}
						placeholder={ __(
							'Enter title (required)',
							'wp-ranked-list-blocks'
						) }
						className="ranked-list-item-editor__title"
					/>
					<TextControl
						label={ __( 'Subtitle', 'wp-ranked-list-blocks' ) }
						value={ subtitle }
						onChange={ ( value ) =>
							setAttributes( { subtitle: value } )
						}
						placeholder={ __(
							'Enter subtitle (optional)',
							'wp-ranked-list-blocks'
						) }
					/>
					<div className="ranked-list-item-editor__description-wrap">
						<label className="components-base-control__label">
							{ __( 'Description', 'wp-ranked-list-blocks' ) }
						</label>
						<RichText
							tagName="div"
							value={ description }
							onChange={ ( value ) =>
								setAttributes( { description: value } )
							}
							placeholder={ __(
								'Enter description',
								'wp-ranked-list-blocks'
							) }
							className="ranked-list-item-editor__description"
							multiline="p"
							allowedFormats={ [
								'core/bold',
								'core/italic',
								'core/link',
							] }
						/>
					</div>
					<TextControl
						label={ __( 'URL', 'wp-ranked-list-blocks' ) }
						value={ url }
						onChange={ ( value ) =>
							setAttributes( { url: value } )
						}
						placeholder="https://"
						type="url"
					/>
					<TextControl
						label={ __( 'Button text', 'wp-ranked-list-blocks' ) }
						value={ urlButtonText }
						onChange={ ( value ) =>
							setAttributes( { urlButtonText: value } )
						}
						placeholder={ __( 'View site', 'wp-ranked-list-blocks' ) }
						help={ __(
							'Link button below title/subtitle. Opens in new window.',
							'wp-ranked-list-blocks'
						) }
					/>
				</div>
			</div>
		</>
	);
}
