<?php
/**
 * Plugin Name: WP Ranked List Blocks
 * Description: Semantically marked-up ranked list (listicle) blocks for WordPress. Outputs schema.org ItemList JSON-LD for search and AI ingestion.
 * Version: 1.1.0
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * Author: Chris Gee
 * Author URI: https://withchrisgee.com
 * Text Domain: wp-ranked-list-blocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WCG_RANKED_LIST_ITEM_VERSION', '1.1.0' );
define( 'WCG_RANKED_LIST_ITEM_PATH', plugin_dir_path( __FILE__ ) );

require_once WCG_RANKED_LIST_ITEM_PATH . 'includes/schema.php';

/**
 * Register the block.
 */
function wcg_ranked_list_item_register_block() {
	register_block_type( WCG_RANKED_LIST_ITEM_PATH, array(
		'render_callback' => 'wcg_ranked_list_item_render_callback',
	) );
}
add_action( 'init', 'wcg_ranked_list_item_register_block' );

/**
 * Reset position counter at the start of each the_content run so positions
 * are 1, 2, 3… for the blocks in this content, not cumulative across multiple renders.
 */
function wcg_ranked_list_item_reset_position_for_content( $content ) {
	wcg_ranked_list_item_reset_position_counter();
	return $content;
}
add_filter( 'the_content', 'wcg_ranked_list_item_reset_position_for_content', 0 );

/**
 * Render the block on the frontend.
 */
function wcg_ranked_list_item_render_callback( $attributes, $content, $block ) {
	$position      = wcg_ranked_list_item_get_position( $block );
	$title         = esc_html( $attributes['title'] ?? '' );
	$subtitle      = esc_html( $attributes['subtitle'] ?? '' );
	$description   = wp_kses_post( $attributes['description'] ?? '' );
	$image_url     = esc_url( $attributes['imageUrl'] ?? '' );
	$image_alt     = esc_attr( $attributes['imageAlt'] ?? $title );
	$hero_image_url = esc_url( $attributes['heroImageUrl'] ?? '' );
	$hero_image_alt = esc_attr( $attributes['heroImageAlt'] ?? '' );
	$url               = esc_url( $attributes['url'] ?? '' );
	$url_button_text   = ! empty( $attributes['urlButtonText'] ) ? esc_html( $attributes['urlButtonText'] ) : esc_html( __( 'View site', 'wp-ranked-list-blocks' ) );

	if ( empty( $title ) ) {
		return '';
	}

	$output = '<div class="ranked-list-item" data-position="' . esc_attr( $position ) . '">';

	if ( $hero_image_url ) {
		$output .= '<div class="ranked-list-item__hero">';
		$output .= '<img src="' . $hero_image_url . '" alt="' . $hero_image_alt . '" class="ranked-list-item__hero-img">';
		$output .= '</div>';
	}

	$output .= '<div class="ranked-list-item__row">';
	if ( $image_url ) {
		$output .= '<div class="ranked-list-item__logo-col">';
		$output .= '<img src="' . $image_url . '" alt="' . $image_alt . '" class="ranked-list-item__logo">';
		$output .= '</div>';
	}
	$output .= '<div class="ranked-list-item__main-col">';
	$output .= '<h3 class="ranked-list-item__title">';
	if ( $url ) {
		$output .= '<a href="' . $url . '">' . $title . '</a>';
	} else {
		$output .= $title;
	}
	$output .= '</h3>';
	if ( $subtitle ) {
		$output .= '<p class="ranked-list-item__subtitle">' . $subtitle . '</p>';
	}
	$output .= '</div>';
	$output .= '</div>';

	if ( $description ) {
		$output .= '<div class="ranked-list-item__description">' . $description . '</div>';
	}

	if ( $url ) {
		$output .= '<div class="ranked-list-item__link-wrap">';
		$output .= '<a href="' . $url . '" class="ranked-list-item__link" target="_blank" rel="noopener noreferrer">' . $url_button_text . '</a>';
		$output .= '</div>';
	}

	$output .= '</div>';

	return $output;
}

/**
 * Reset the position counter. Called at the start of each the_content run
 * so positions are per-render (1, 2, 3…) not cumulative.
 */
function wcg_ranked_list_item_reset_position_counter() {
	// Use a static that get_position can read.
	$GLOBALS['wcg_ranked_list_item_position_counter'] = 0;
}

/**
 * Get the position of a block within the post content by counting
 * ranked-list-block blocks that appear before it.
 */
function wcg_ranked_list_item_get_position( $block ) {
	if ( ! isset( $GLOBALS['wcg_ranked_list_item_position_counter'] ) ) {
		$GLOBALS['wcg_ranked_list_item_position_counter'] = 0;
	}
	$GLOBALS['wcg_ranked_list_item_position_counter']++;
	return $GLOBALS['wcg_ranked_list_item_position_counter'];
}
