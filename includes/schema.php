<?php
/**
 * Schema JSON-LD output for Ranked List Item blocks.
 *
 * @package WCG\RankedListItem
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Output ItemList JSON-LD schema in the page head.
 */
function wcg_ranked_list_item_output_schema() {
	if ( ! is_singular() ) {
		return;
	}

	$post = get_post();
	if ( ! $post || ! has_blocks( $post->post_content ) ) {
		return;
	}

	$blocks = parse_blocks( $post->post_content );
	$items  = wcg_ranked_list_item_collect_blocks( $blocks );

	// Only output schema when 2+ blocks present.
	if ( count( $items ) < 2 ) {
		return;
	}

	$list_elements = array();
	$position      = 0;

	foreach ( $items as $attrs ) {
		$position++;

		$title = $attrs['title'] ?? '';
		if ( empty( $title ) ) {
			continue;
		}

		$schema_type = $attrs['schemaType'] ?? 'Product';

		$item = array(
			'@type' => $schema_type,
			'name'  => $title,
		);

		// Common optional fields (no alternativeName — not valid for all types e.g. SoftwareApplication).
		if ( ! empty( $attrs['description'] ) ) {
			$item['description'] = $attrs['description'];
		}
		if ( ! empty( $attrs['url'] ) ) {
			$item['url'] = $attrs['url'];
		}
		if ( ! empty( $attrs['imageUrl'] ) && 'Platform' !== $schema_type ) {
			$item['image'] = $attrs['imageUrl'];
		}

		// Type-specific fields.
		$product_types  = array( 'Product', 'SoftwareApplication' );
		$place_types    = array( 'Place', 'LocalBusiness', 'Restaurant' );
		$creative_types = array( 'Book', 'Movie', 'CreativeWork' );
		$podcast_types  = array( 'PodcastSeries', 'PodcastEpisode' );

		if ( 'Platform' === $schema_type ) {
			wcg_ranked_list_item_add_platform_schema( $item, $attrs );
		} elseif ( in_array( $schema_type, $product_types, true ) ) {
			wcg_ranked_list_item_add_product_schema( $item, $attrs );
		} elseif ( in_array( $schema_type, $place_types, true ) ) {
			wcg_ranked_list_item_add_place_schema( $item, $attrs );
		} elseif ( in_array( $schema_type, $creative_types, true ) ) {
			wcg_ranked_list_item_add_creative_schema( $item, $attrs );
		} elseif ( in_array( $schema_type, $podcast_types, true ) ) {
			wcg_ranked_list_item_add_podcast_schema( $item, $attrs, $schema_type );
		}

		// Add aggregate rating if provided.
		wcg_ranked_list_item_add_rating( $item, $attrs );

		$list_elements[] = array(
			'@type'    => 'ListItem',
			'position' => $position,
			'item'     => $item,
		);
	}

	if ( empty( $list_elements ) ) {
		return;
	}

	$schema = array(
		'@context'        => 'https://schema.org',
		'@type'           => 'ItemList',
		'numberOfItems'   => count( $list_elements ),
		'itemListOrder'   => 'Descending',
		'itemListElement' => $list_elements,
	);

	echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}
add_action( 'wp_head', 'wcg_ranked_list_item_output_schema', 5 );

/**
 * Recursively collect all ranked-list-block blocks from parsed blocks.
 */
function wcg_ranked_list_item_collect_blocks( $blocks ) {
	$items = array();

	foreach ( $blocks as $block ) {
		if ( 'wcg/ranked-list-block' === $block['blockName'] ) {
			$items[] = $block['attrs'] ?? array();
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$items = array_merge( $items, wcg_ranked_list_item_collect_blocks( $block['innerBlocks'] ) );
		}
	}

	return $items;
}

/**
 * Add Platform (Thing) schema properties.
 * Visible: image (hero + logo as image[], Thing has no "logo"), name, disambiguatingDescription (subtitle), description, url.
 * Meta only: alternateName, sameAs.
 * Thing supports multiple images via "image" as URL or array of URLs.
 */
function wcg_ranked_list_item_add_platform_schema( &$item, $attrs ) {
	$item['@type'] = 'Thing';
	if ( ! empty( $attrs['subtitle'] ) ) {
		$item['disambiguatingDescription'] = $attrs['subtitle'];
	}
	$images = array();
	if ( ! empty( $attrs['heroImageUrl'] ) ) {
		$images[] = $attrs['heroImageUrl'];
	}
	if ( ! empty( $attrs['imageUrl'] ) ) {
		$images[] = $attrs['imageUrl'];
	}
	if ( ! empty( $images ) ) {
		$item['image'] = 1 === count( $images ) ? $images[0] : $images;
	}
	if ( ! empty( $attrs['alternateName'] ) ) {
		$item['alternateName'] = $attrs['alternateName'];
	}
	if ( ! empty( $attrs['sameAs'] ) ) {
		$urls = array_map( 'trim', explode( ',', $attrs['sameAs'] ) );
		$urls = array_filter( $urls );
		$item['sameAs'] = 1 === count( $urls ) ? $urls[0] : $urls;
	}
}

/**
 * Add Product/SoftwareApplication specific schema properties.
 */
function wcg_ranked_list_item_add_product_schema( &$item, $attrs ) {
	if ( ! empty( $attrs['price'] ) && is_numeric( $attrs['price'] ) ) {
		$item['offers'] = array(
			'@type'         => 'Offer',
			'price'         => (float) $attrs['price'],
			'priceCurrency' => $attrs['currency'] ?? 'GBP',
		);
	}
}

/**
 * Add Place/LocalBusiness/Restaurant specific schema properties.
 */
function wcg_ranked_list_item_add_place_schema( &$item, $attrs ) {
	if ( ! empty( $attrs['address'] ) ) {
		$item['address'] = array(
			'@type'         => 'PostalAddress',
			'streetAddress' => $attrs['address'],
		);
	}
	if ( ! empty( $attrs['telephone'] ) ) {
		$item['telephone'] = $attrs['telephone'];
	}
}

/**
 * Add Book/Movie/CreativeWork specific schema properties.
 */
function wcg_ranked_list_item_add_creative_schema( &$item, $attrs ) {
	if ( ! empty( $attrs['author'] ) ) {
		$item['author'] = array(
			'@type' => 'Person',
			'name'  => $attrs['author'],
		);
	}
	if ( ! empty( $attrs['datePublished'] ) ) {
		$item['datePublished'] = $attrs['datePublished'];
	}
}

/**
 * Add PodcastSeries / PodcastEpisode schema properties.
 * Uses author (host/creator), datePublished (episode). Prefers hero image for cover art when set.
 */
function wcg_ranked_list_item_add_podcast_schema( &$item, $attrs, $schema_type ) {
	if ( ! empty( $attrs['heroImageUrl'] ) ) {
		$item['image'] = $attrs['heroImageUrl'];
	} elseif ( ! empty( $attrs['imageUrl'] ) && empty( $item['image'] ) ) {
		$item['image'] = $attrs['imageUrl'];
	}
	if ( ! empty( $attrs['author'] ) ) {
		$item['author'] = array(
			'@type' => 'Person',
			'name'  => $attrs['author'],
		);
	}
	if ( 'PodcastEpisode' === $schema_type && ! empty( $attrs['datePublished'] ) ) {
		$item['datePublished'] = $attrs['datePublished'];
	}
}

/**
 * Add aggregate rating to item if rating data provided.
 */
function wcg_ranked_list_item_add_rating( &$item, $attrs ) {
	$rating_value = $attrs['ratingValue'] ?? '';
	$review_count = $attrs['reviewCount'] ?? '';

	if ( '' === $rating_value && '' === $review_count ) {
		return;
	}

	$rating = array(
		'@type' => 'AggregateRating',
	);

	if ( '' !== $rating_value && is_numeric( $rating_value ) ) {
		$rating_float = (float) $rating_value;
		if ( $rating_float >= 0 && $rating_float <= 5 ) {
			$rating['ratingValue'] = $rating_float;
			$rating['bestRating']  = 5;
			$rating['worstRating'] = 0;
		}
	}

	if ( '' !== $review_count && is_numeric( $review_count ) && (int) $review_count > 0 ) {
		$rating['reviewCount'] = (int) $review_count;
	}

	// Only add if we have at least one valid value.
	if ( isset( $rating['ratingValue'] ) || isset( $rating['reviewCount'] ) ) {
		$item['aggregateRating'] = $rating;
	}
}
