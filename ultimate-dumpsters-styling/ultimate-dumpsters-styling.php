<?php
/**
 * Plugin Name: Ultimate Dumpsters Premium Styling
 * Description: Premium Apple/Tesla design system for Ultimate Dumpsters city pages
 * Version: 1.0.1
 * Author: Ultimate Dumpsters
 */

if (!defined('ABSPATH')) exit;

function ultimate_dumpsters_enqueue_styles() {
    wp_enqueue_style(
        'ultimate-dumpsters-premium',
        plugin_dir_url(__FILE__) . 'assets/premium-style.css',
        array(),
        '1.0.1',
        'all'
    );
}
add_action('wp_enqueue_scripts', 'ultimate_dumpsters_enqueue_styles', 999);

// Add inline CSS to force styling on Divi pages
function ultimate_dumpsters_force_styling() {
    if (is_page()) {
        echo '<style>
            /* Force content visibility */
            .dumpster-rental-content,
            .trust-header,
            .floating-cta,
            article.dumpster-rental-content {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            /* Override Divi container restrictions */
            #main-content .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
            }
            
            /* Hide Divi sidebar */
            #left-area {
                display: none !important;
            }
            
            #main-content {
                width: 100% !important;
                float: none !important;
            }
        </style>';
    }
}
add_action('wp_head', 'ultimate_dumpsters_force_styling', 999);