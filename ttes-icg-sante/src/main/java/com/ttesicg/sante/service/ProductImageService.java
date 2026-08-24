package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.ProductImageRequest;
import com.ttesicg.sante.dto.ProductImageResponse;
import com.ttesicg.sante.entity.Product;
import com.ttesicg.sante.entity.ProductImage;
import com.ttesicg.sante.repository.ProductImageRepository;
import com.ttesicg.sante.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;


import java.util.List;



@Service
@RequiredArgsConstructor
public class ProductImageService {



    private final ProductImageRepository productImageRepository;


    private final ProductRepository productRepository;



    public ProductImageResponse addImage(
            Long productId,
            ProductImageRequest request
    ){


        Product product =
                productRepository.findById(productId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Produit introuvable"
                                )
                        );



        ProductImage image =
                ProductImage.builder()

                        .product(product)

                        .imageUrl(
                                request.getImageUrl()
                        )

                        .main(
                                request.getMain()
                        )

                        .displayOrder(
                                request.getDisplayOrder()
                        )

                        .build();



        productImageRepository.save(image);



        return map(image);

    }




    public List<ProductImageResponse> findByProduct(
            Long productId
    ){


        return productImageRepository
                .findByProductId(productId)
                .stream()
                .map(this::map)
                .toList();

    }





    public void delete(Long id){

        productImageRepository.deleteById(id);

    }





    private ProductImageResponse map(
            ProductImage image
    ){

        return ProductImageResponse.builder()

                .id(image.getId())

                .imageUrl(
                        image.getImageUrl()
                )

                .main(
                        image.getMain()
                )

                .displayOrder(
                        image.getDisplayOrder()
                )

                .build();

    }

}