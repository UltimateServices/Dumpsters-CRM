<?php
/**
 * Template Name: City Page Full Width
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<?php
// Get header
get_header();

// Output page content
while (have_posts()) {
    the_post();
    the_content();
}

// Get footer
get_footer();
?>

<?php wp_footer(); ?>
</body>
</html>