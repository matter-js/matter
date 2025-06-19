/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto, DerBitString, DerCodec, X962 } from "#general";
import { assertCertificateDerSize } from "./common.js";
import { AttestationCertificate } from "./definitions/attestation.js";
import { X509Certificate } from "./definitions/base.js";
import { X509Base } from "./X509Base.js";

/**
 * Base class for Attestation Certificates (PAA, PAI, DAC).
 */
export abstract class AttestationBaseCertificate<CT extends X509Certificate> extends X509Base<CT> {
    /**
     * Sign the certificate using the provided crypto and key.
     * If the certificate is already signed, it throws a CertificateError.
     */
    override async sign(crypto: Crypto, key: JsonWebKey) {
        this.signature = await crypto.signEcdsa(key, this.asUnsignedAsn1(), "der");
    }

    /**
     * Returns the signed certificate in ASN.1 DER format.
     * If the certificate is not signed, it throws a CertificateError.
     */
    asSignedAsn1(): Uint8Array<ArrayBufferLike> {
        const certificate = this.genericBuildAsn1Structure(this.cert);
        const certBytes = DerCodec.encode({
            certificate,
            signAlgorithm: X962.EcdsaWithSHA256,
            signature: DerBitString(this.signature),
        });
        assertCertificateDerSize(certBytes);
        return certBytes;
    }
}

/** PAA (Product Attestation Authority) Certificate. */
export class Paa extends AttestationBaseCertificate<AttestationCertificate.Paa> {}

/** PAI (Product Attestation Intermediate) Certificate. */
export class Pai extends AttestationBaseCertificate<AttestationCertificate.Pai> {}

/** DAC (Device Attestation Certificate) Certificate. */
export class Dac extends AttestationBaseCertificate<AttestationCertificate.Dac> {}
