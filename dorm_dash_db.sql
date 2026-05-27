-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 28, 2026 at 01:30 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dorm_dash_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddInquiry` (IN `p_property_id` INT, IN `p_tenant_id` INT, IN `p_lease_term` INT, IN `p_tenant_name` VARCHAR(100), IN `p_property_name` VARCHAR(100), IN `p_message` TEXT)   BEGIN
    INSERT INTO inquiries (property_id, tenant_id, lease_term_months, tenant_name, property_name, message, status) 
    VALUES (p_property_id, p_tenant_id, p_lease_term, p_tenant_name, p_property_name, p_message, 'pending');
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddLeaseRecord` (IN `p_property_id` INT, IN `p_tenant_id` INT, IN `p_property_name` VARCHAR(255), IN `p_monthly_rate` DECIMAL(15,2), IN `p_lease_term` INT, IN `p_unit_occupancy` VARCHAR(255))   BEGIN
    DECLARE v_total_calculated DECIMAL(15,2);
    
    -- Calculate complete lease valuation contract financials natively
    SET v_total_calculated = p_monthly_rate * p_lease_term;

    INSERT INTO rentings (
        property_id, 
        tenant_id, 
        property_name, 
        monthly_rate, 
        lease_term, 
        total_due, 
        pending_payment, 
        unit_occupancy,
        status, 
        start_date
    ) VALUES (
        p_property_id,
        p_tenant_id,
        p_property_name,
        p_monthly_rate,
        p_lease_term,
        v_total_calculated,
        v_total_calculated, -- Initial pending payment matches total due
        p_unit_occupancy,
        'Active',
        CURDATE()
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ApproveInquiry` (IN `p_inquiry_id` INT, IN `p_unit_occupancy` VARCHAR(50))   BEGIN
    -- This logic is handled via the Model using the database connection 
    -- because of the specific balance check requirements in your sample.
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ApproveInquiryRoutine` (IN `p_inquiry_id` INT, IN `p_unit_occupancy` VARCHAR(255))  MODIFIES SQL DATA BEGIN
    -- Declare operational and tracking tracking variables
    DECLARE v_property_id INT;
    DECLARE v_tenant_id INT;
    DECLARE v_lease_term INT;
    DECLARE v_property_name VARCHAR(255);
    DECLARE v_monthly_rate DECIMAL(15,2);
    DECLARE v_owner_id INT;
    DECLARE v_tenant_balance DECIMAL(15,2);
    DECLARE v_total_due DECIMAL(15,2);

    -- Setup structural transaction failure state error handler rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Transaction failed: Execution aborted inside database engine.';
    END;

    START TRANSACTION;

    -- 1. Fetch deep inquiry parameters 
    SELECT property_id, tenant_id, lease_term_months
    INTO v_property_id, v_tenant_id, v_lease_term
    FROM inquiries WHERE id = p_inquiry_id;

    -- Fallback structural confirmation triggers
    IF v_property_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inquiry not found.';
    END IF;

    -- 2. Fetch locked property tracking information
    SELECT name, price_monthly, owner_id 
    INTO v_property_name, v_monthly_rate, v_owner_id
    FROM properties WHERE id = v_property_id;

    IF v_monthly_rate IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Property configuration records not found.';
    END IF;

    -- 3. Check Tenant solvency with structural pessimistic row locking
    SELECT balance INTO v_tenant_balance 
    FROM users WHERE id = v_tenant_id FOR UPDATE;

    IF v_tenant_balance IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tenant account record missing.';
    END IF;

    IF v_tenant_balance < v_monthly_rate THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tenant has insufficient balance for initial month payment.';
    END IF;

    -- 4. Atomic Balance Transfer ledger manipulation steps
    UPDATE users SET balance = balance - v_monthly_rate WHERE id = v_tenant_id;
    UPDATE users SET balance = balance + v_monthly_rate WHERE id = v_owner_id;

    -- 5. Calculate global financial metrics
    SET v_total_due = v_monthly_rate * v_lease_term;

    -- 6. Insert new active operational contract record
    INSERT INTO rentings (
        property_id, 
        tenant_id, 
        property_name, 
        monthly_rate, 
        lease_term, 
        total_due, 
        status, 
        start_date, 
        unit_occupancy,
        months_pending, 
        pending_payment, 
        total_paid
    ) VALUES (
        v_property_id,
        v_tenant_id,
        v_property_name,
        v_monthly_rate,
        v_lease_term,
        v_total_due,
        'Active',
        CURDATE(),
        p_unit_occupancy,
        (v_lease_term - 1),
        (v_total_due - v_monthly_rate),
        v_monthly_rate
    );

    -- 7. Remove processed applications allocation structures
    DELETE FROM inquiries WHERE id = p_inquiry_id;

    COMMIT;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AuthLogin` (IN `p_email` VARCHAR(100))   BEGIN
    SELECT id, username, password 
    FROM users 
    WHERE email = p_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AuthRegister` (IN `p_username` VARCHAR(50), IN `p_email` VARCHAR(100), IN `p_password` VARCHAR(255))   BEGIN
    INSERT INTO users (username, email, password) 
    VALUES (p_username, p_email, p_password);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreateInquiry` (IN `p_property_id` INT, IN `p_tenant_id` INT, IN `p_lease_term` INT, IN `p_tenant_name` VARCHAR(100), IN `p_property_name` VARCHAR(100), IN `p_message` TEXT)   BEGIN
    INSERT INTO inquiries (
        property_id, 
        tenant_id, 
        lease_term_months, 
        tenant_name, 
        property_name, 
        message, 
        status
    ) VALUES (
        p_property_id, 
        p_tenant_id, 
        p_lease_term, 
        p_tenant_name, 
        p_property_name, 
        p_message, 
        'pending'
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `DeclineInquiry` (IN `p_inquiry_id` INT)   BEGIN
    DELETE FROM inquiries WHERE id = p_inquiry_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `DeleteInquiry` (IN `p_inquiry_id` INT)   BEGIN
    DELETE FROM inquiries WHERE id = p_inquiry_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `DeletePropertyCascade` (IN `p_property_id` INT)   BEGIN
    DECLARE v_unpaid_count INT;

    -- Check for unpaid balances
    SELECT COUNT(*) INTO v_unpaid_count 
    FROM rentings 
    WHERE property_id = p_property_id AND total_paid < total_due;

    IF v_unpaid_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete property. There are tenants with pending balances.';
    ELSE
        START TRANSACTION;
            -- Wipe secondary reference targets first
            DELETE FROM rentings WHERE property_id = p_property_id;
            -- Wipe core entity directory row target
            DELETE FROM properties WHERE id = p_property_id;
        COMMIT;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllInquiries` ()   BEGIN
    SELECT 
        id, 
        property_id, 
        tenant_id, 
        lease_term_months, 
        tenant_name, 
        property_name, 
        created_at, 
        message, 
        status 
    FROM inquiries;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllTenantsAdmin` ()   BEGIN
    SELECT 
        u.id, u.full_name, u.email, u.username,
        r.property_name, r.status as lease_status
    FROM users u
    INNER JOIN rentings r ON u.id = r.tenant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllTransactions` ()   BEGIN
    SELECT 
        id, 
        tenant_id, 
        renting_id, 
        property_id, 
        amount, 
        transaction_type, 
        payment_method, 
        status, 
        reference_number, 
        created_at, 
        owner_id, 
        months_paid, 
        unit_occupancy AS unit_occupancy
    FROM transactions;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetFilteredTransactions` (IN `p_user_id` INT, IN `p_unit_occupancy` VARCHAR(255))   BEGIN
    SELECT * FROM transactions 
    WHERE (owner_id = p_user_id OR tenant_id = p_user_id)
    AND unit_occupancy = p_unit_occupancy;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetInquiries` ()   BEGIN
    SELECT id, property_id, tenant_id, lease_term_months, tenant_name, property_name, created_at, message, status 
    FROM inquiries;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetLeaseDetails` (IN `p_lease_id` INT)   BEGIN
    SELECT 
        r.id AS id,
        r.property_id AS propertyId,
        r.property_name AS propertyName,
        r.start_date AS startDate,
        r.lease_term AS leaseTerm,
        r.monthly_rate AS monthlyRate,
        IFNULL(r.months_pending, 0) AS monthsPending,
        IFNULL(r.pending_payment, 0.00) AS pendingPayment,
        r.tenant_id AS tenantId,
        IFNULL(r.total_paid, 0.00) AS totalPaid,
        IFNULL(r.total_due, 0.00) AS totalDue,
        r.status AS status,
        p.image_url AS imageUrl,
        p.owner_id AS ownerId,
        r.unit_occupancy AS unitOccupancy
    FROM rentings r
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE r.id = p_lease_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetLoginData` (IN `p_email` VARCHAR(100))   BEGIN
    SELECT id, username, password, email 
    FROM users 
    WHERE email = p_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetOccupancyReport` ()   BEGIN
    SELECT 
        (SELECT COUNT(*) FROM properties WHERE status = 'occupied') as occupied_units,
        (SELECT COUNT(*) FROM properties) as total_units,
        ((SELECT COUNT(*) FROM properties WHERE status = 'occupied') / (SELECT COUNT(*) FROM properties) * 100) as occupancy_rate;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetProperties` ()   BEGIN
    SELECT 
        p.id, 
        p.owner_id, 
        p.name, 
        p.location_address, 
        p.price_monthly, 
        p.type, 
        p.status, 
        p.image_url, 
        p.map_image_url, 
        p.created_at, 
        p.amenities, 
        u.full_name AS owner_name, 
        u.username, 
        u.profile_picture 
    FROM properties p 
    INNER JOIN users u ON p.owner_id = u.id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetPropertiesByOwner` (IN `p_owner_id` INT)   BEGIN
    SELECT p.*, u.full_name as owner_name, u.username, u.profile_picture 
    FROM properties p 
    JOIN users u ON p.owner_id = u.id 
    WHERE p.owner_id = p_owner_id
    ORDER BY p.id DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetPropertyById` (IN `p_id` INT)   BEGIN
    SELECT p.*, u.full_name as owner_name, u.username, u.profile_picture 
    FROM properties p 
    JOIN users u ON p.owner_id = u.id 
    WHERE p.id = p_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetRevenueReport` ()   BEGIN
    SELECT 
        SUM(amount) as total_collected,
        COUNT(id) as total_transactions,
        MONTHNAME(created_at) as month
    FROM transactions 
    WHERE status = 'Success'
    GROUP BY MONTH(created_at);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetTenantHistory` (IN `p_tenant_id` INT)   BEGIN
    SELECT 
        t.id, 
        t.amount, 
        t.payment_method, 
        t.status, 
        t.reference_number, 
        t.created_at,
        t.renting_id,
        t.property_id,
        t.owner_id,
        t.months_paid,
        t.unit_occupancy,
        u.full_name AS tenant_name,
        p.name AS property_name
    FROM transactions t
    LEFT JOIN users u ON t.tenant_id = u.id
    LEFT JOIN properties p ON t.property_id = p.id
    WHERE t.tenant_id = p_tenant_id
    ORDER BY t.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetTenantsByOwner` (IN `p_owner_id` INT)   BEGIN
    SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.username,
        r.property_name, 
        r.status AS lease_status
    FROM users u
    INNER JOIN rentings r ON u.id = r.tenant_id
    INNER JOIN properties p ON r.property_id = p.id
    WHERE p.owner_id = p_owner_id
    ORDER BY u.full_name ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetTenantsByProperty` (IN `p_property_id` INT)   BEGIN
    SELECT 
        r.id AS id,
        r.tenant_id AS tenantId,
        IFNULL(u.full_name, IFNULL(u.username, 'Unknown Tenant')) AS tenantName,
        r.unit_occupancy AS occupancy,
        IFNULL(r.lease_term, 0) AS leaseTerm,
        CASE 
            WHEN IFNULL(r.pending_payment, 0) > 0 THEN 'Pending'
            ELSE 'Up to date'
        END AS pendingStatus,
        IFNULL(r.pending_payment, 0.00) AS pendingPayment,
        IFNULL(r.total_paid, 0.00) AS totalPaid,
        IFNULL(r.total_due, 0.00) AS totalDue,
        DATE_FORMAT(r.start_date, '%M %e, %Y') AS startDate,
        IFNULL(r.monthly_rate, 0.00) AS monthlyRate
    FROM rentings r
    LEFT JOIN users u ON r.tenant_id = u.id
    WHERE r.property_id = p_property_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetUserLeases` (IN `p_user_id` INT)   BEGIN
    SELECT 
        r.id AS id,
        r.property_id AS propertyId,
        r.property_name AS propertyName,
        r.start_date AS startDate,
        r.lease_term AS leaseTerm,
        r.monthly_rate AS monthlyRate,
        IFNULL(r.months_pending, 0) AS monthsPending,
        IFNULL(r.pending_payment, 0.00) AS pendingPayment,
        r.tenant_id AS tenantId,
        IFNULL(r.total_paid, 0.00) AS totalPaid,
        IFNULL(r.total_due, 0.00) AS totalDue,
        r.status AS status,
        p.image_url AS imageUrl,
        p.owner_id AS ownerId,
        r.unit_occupancy AS unitOccupancy
    FROM rentings r
    LEFT JOIN properties p ON r.property_id = p.id 
    WHERE r.tenant_id = p_user_id OR p.owner_id = p_user_id
    ORDER BY r.id DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetUserProfile` (IN `p_user_id` INT)   BEGIN
    SELECT 
        id, 
        username, 
        full_name, 
        email, 
        phone_number, 
        date_of_birth, 
        address, 
        country, 
        gender, 
        created_at, 
        balance, 
        profile_picture, 
        payment_methods 
    FROM users 
    WHERE id = p_user_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ManageProperty` (IN `p_action` VARCHAR(10), IN `p_id` INT, IN `p_owner_id` INT, IN `p_name` VARCHAR(255), IN `p_type` VARCHAR(50), IN `p_price` DECIMAL(15,2), IN `p_address` TEXT, IN `p_img` TEXT, IN `p_map_img` TEXT, IN `p_amenities` TEXT, IN `p_status` VARCHAR(50))   BEGIN
    IF p_action = 'add' THEN
        INSERT INTO properties (owner_id, name, type, price_monthly, location_address, image_url, map_image_url, amenities, status)
        VALUES (p_owner_id, p_name, p_type, p_price, p_address, p_img, p_map_img, p_amenities, 'available');
        
    ELSEIF p_action = 'edit' THEN
        UPDATE properties SET 
            name = COALESCE(p_name, name), 
            type = COALESCE(p_type, type), 
            price_monthly = COALESCE(p_price, price_monthly), 
            location_address = COALESCE(p_address, location_address),
            image_url = COALESCE(p_img, image_url), 
            map_image_url = COALESCE(p_map_img, map_image_url), 
            amenities = COALESCE(p_amenities, amenities)
        WHERE id = p_id;
        
    ELSEIF p_action = 'status' THEN
        UPDATE properties SET status = p_status WHERE id = p_id;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `PostPaymentRecord` (IN `p_tenant_id` INT, IN `p_owner_id` INT, IN `p_renting_id` INT, IN `p_property_id` INT, IN `p_unit_occupancy` VARCHAR(50), IN `p_amount` DECIMAL(10,2), IN `p_months_paid` INT, IN `p_months_pending` INT, IN `p_status` VARCHAR(20), IN `p_pending_payment` DECIMAL(10,2), IN `p_payment_method` VARCHAR(50), IN `p_reference_number` VARCHAR(20))   BEGIN
    -- 1. Deduct from the tenant's wallet
    UPDATE users 
    SET balance = balance - p_amount 
    WHERE id = p_tenant_id;

    -- 2. Update the renting record
    UPDATE rentings 
    SET 
        total_paid = total_paid + p_amount,
        months_pending = p_months_pending,
        pending_payment = p_pending_payment,
        status = p_status
    WHERE id = p_renting_id;

    -- 3. Record the transaction
    INSERT INTO transactions (
        tenant_id, owner_id, renting_id, property_id, unit_occupancy, 
        amount, months_paid, status, payment_method, reference_number
    )
    VALUES (
        p_tenant_id, p_owner_id, p_renting_id, p_property_id, p_unit_occupancy, 
        p_amount, p_months_paid, p_status, p_payment_method, p_reference_number
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ProcessPayment` (IN `p_tenant_id` INT, IN `p_renting_id` INT, IN `p_property_id` INT, IN `p_owner_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_months_paid` INT, IN `p_ref_no` VARCHAR(20))   BEGIN
    START TRANSACTION;

    -- 1. Deduct from tenant balance
    UPDATE users 
    SET balance = balance - p_amount 
    WHERE id = p_tenant_id AND balance >= p_amount;

    -- Strict confirmation check: Did the update succeed?
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment Failed: Tenant balance is insufficient or account invalid.';
    END IF;

    -- 2. Add to owner balance (Only runs if tenant update succeeded)
    UPDATE users 
    SET balance = balance + p_amount 
    WHERE id = p_owner_id;

    -- 3. Update Lease Record (Matches rentings table columns perfectly)
    UPDATE rentings 
    SET 
        total_paid = total_paid + p_amount,
        pending_payment = GREATEST(0.00, pending_payment - p_amount),
        months_pending = GREATEST(0, months_pending - p_months_paid)
    WHERE id = p_renting_id;

    -- 4. Log Transaction (Matches transactions table columns perfectly)
    INSERT INTO transactions (
        tenant_id, 
        renting_id, 
        property_id, 
        amount, 
        transaction_type, 
        payment_method, 
        status, 
        reference_number, 
        owner_id, 
        months_paid,
        unit_occupancy
    ) VALUES (
        p_tenant_id, 
        p_renting_id, 
        p_property_id, 
        p_amount, 
        'Rent Payment', 
        'Wallet', 
        'Success', 
        p_ref_no, 
        p_owner_id, 
        p_months_paid,
        (SELECT unit_occupancy FROM rentings WHERE id = p_renting_id LIMIT 1)
    );

    COMMIT;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `RemoveTenant` (IN `p_renting_id` INT)   BEGIN
    DELETE FROM rentings WHERE id = p_renting_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateInquiryStatus` (IN `p_inquiry_id` INT, IN `p_status` ENUM('pending','accepted','rejected'))   BEGIN
    UPDATE inquiries 
    SET status = p_status 
    WHERE id = p_inquiry_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateUserProfile` (IN `p_user_id` INT, IN `p_username` VARCHAR(100), IN `p_full_name` VARCHAR(255), IN `p_phone_enc` TEXT, IN `p_phone_iv` VARCHAR(255), IN `p_phone_tag` VARCHAR(255), IN `p_dob` DATE, IN `p_address_enc` TEXT, IN `p_address_iv` VARCHAR(255), IN `p_address_tag` VARCHAR(255), IN `p_country` VARCHAR(100), IN `p_gender` VARCHAR(20), IN `p_profile_pic` TEXT, IN `p_payments` JSON)   BEGIN
    UPDATE users 
    SET 
        username = p_username, 
        full_name = p_full_name, 
        phone_number = p_phone_enc,
        phone_iv = p_phone_iv,
        phone_tag = p_phone_tag,
        date_of_birth = p_dob, 
        address = p_address_enc,
        address_iv = p_address_iv,
        address_tag = p_address_tag,
        country = p_country, 
        gender = p_gender,
        profile_picture = p_profile_pic,
        payment_methods = p_payments
    WHERE id = p_user_id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `inquiries`
--

CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL,
  `tenant_name` varchar(255) DEFAULT NULL,
  `property_name` varchar(255) DEFAULT NULL,
  `property_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `balance` decimal(15,2) DEFAULT 0.00,
  `lease_term_months` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inquiries`
--

INSERT INTO `inquiries` (`id`, `tenant_name`, `property_name`, `property_id`, `tenant_id`, `balance`, `lease_term_months`, `message`, `status`, `created_at`) VALUES
(52, 'Emma Watson', 'Rizza\'s Bedspace', 41, 19, 150000.00, 6, 'Dear Alex Johnson,\n\nI hope this message finds you well. My name is Emma Watson, and I am writing to formally express my interest in renting your property, Rizza\'s Bedspace, as listed on Dorm Dash.\n\nI am looking to secure a lease for a duration of 6 months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱3,500.\n\nPlease let me know the next steps regarding the rental agreement and any further requirements you may need from my end.\n\nThank you for your time and consideration.\n\nSincerely,\nEmma Watson\nDate: 5/28/2026', 'pending', '2026-05-26 16:00:00'),
(53, 'David Lee', 'Ed\'s Dormitory', 42, 20, 150000.00, 6, 'Dear Maria Clara,\n\nI hope this message finds you well. My name is David Lee, and I am writing to formally express my interest in renting your property, Ed\'s Dormitory, as listed on Dorm Dash.\n\nI am looking to secure a lease for a duration of 6 months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱4,000.\n\nPlease let me know the next steps regarding the rental agreement and any further requirements you may need from my end.\n\nThank you for your time and consideration.\n\nSincerely,\nDavid Lee\nDate: 5/28/2026', 'pending', '2026-05-26 21:04:09'),
(54, 'Eryhn Jann Amarille', 'Estacio\'s Boarding House', 43, 1, 656232.00, 6, 'Dear John Smith,\n\nI hope this message finds you well. My name is Eryhn Jann Amarille, and I am writing to formally express my interest in renting your property, Estacio\'s Boarding House, as listed on Dorm Dash.\n\nI am looking to secure a lease for a duration of 6 months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱5,000.\n\nPlease let me know the next steps regarding the rental agreement and any further requirements you may need from my end.\n\nThank you for your time and consideration.\n\nSincerely,\nEryhn Jann Amarille\nDate: 5/28/2026', 'pending', '2026-05-26 16:00:00'),
(55, 'Alex Johnson', 'Francis Transient House Olongapo', 44, 16, 150000.00, 6, 'Dear Emma Watson,\n\nI hope this message finds you well. My name is Alex Johnson, and I am writing to formally express my interest in renting your property, Francis Transient House Olongapo, as listed on Dorm Dash.\n\nI am looking to secure a lease for a duration of 6 months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱6,000.\n\nPlease let me know the next steps regarding the rental agreement and any further requirements you may need from my end.\n\nThank you for your time and consideration.\n\nSincerely,\nAlex Johnson\nDate: 5/28/2026', 'pending', '2026-05-26 16:00:00'),
(56, 'Maria Clara', 'BF LODGING HOUSE/DORMITORY', 45, 17, 150000.00, 6, 'Dear David Lee,\n\nI hope this message finds you well. My name is Maria Clara, and I am writing to formally express my interest in renting your property, BF LODGING HOUSE/DORMITORY, as listed on Dorm Dash.\n\nI am looking to secure a lease for a duration of 6 months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱4,500.\n\nPlease let me know the next steps regarding the rental agreement and any further requirements you may need from my end.\n\nThank you for your time and consideration.\n\nSincerely,\nMaria Clara\nDate: 5/28/2026', 'pending', '2026-05-25 16:00:00'),
(59, 'Eryhn Jann Amarille', 'Ed\'s Dormitory', 42, 1, 0.00, 6, 'Dear Landlord,\n\n    I hope this message finds you well. My name is Eryhn Jann Amarille, and I am writing to formally express my interest in renting your property, Ed\'s Dormitory, as listed on Dorm Dash.\n\n    I am looking to secure a lease for a duration of 6 months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱4,000.\n\n    Please let me know the next steps regarding the rental agreement and any further requirements you may need from my end.\n\n    Thank you for your time and consideration.\n\n    Sincerely,\n    Eryhn Jann Amarille\n    Date: 5/28/2026', 'pending', '2026-05-27 21:39:58');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('condo','dorm','bedspace','apartment','boarding house') NOT NULL,
  `price_monthly` decimal(10,2) NOT NULL,
  `location_address` text NOT NULL,
  `image_url` text DEFAULT NULL,
  `map_image_url` text DEFAULT NULL,
  `status` enum('available','occupied','unavailable') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `amenities` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `owner_id`, `name`, `type`, `price_monthly`, `location_address`, `image_url`, `map_image_url`, `status`, `created_at`, `amenities`) VALUES
(40, 1, 'Buena Vista Homes', 'condo', 8000.00, 'Bennette Rd, Olongapo City, 2200 Zambales', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233|https://images.unsplash.com/photo-1502672260266-1c1ef2d93688|https://images.unsplash.com/photo-1524661135-423995f22d0b|https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf', '/images/maps/BuenaVistaHomes.png', 'available', '2026-05-27 23:13:35', 'WiFi, Aircon, Water'),
(41, 16, 'Rizza\'s Bedspace', 'bedspace', 3500.00, '29 E 12th St, Olongapo City, 2200 Zambales', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750|https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af|https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', '/images/maps/RizzaBedspace.png', 'available', '2026-05-27 21:04:09', 'WiFi, Fan, Kitchen'),
(42, 17, 'Ed\'s Dormitory', 'dorm', 4000.00, '20 W 3rd St, Olongapo City, Zambales', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb|https://images.unsplash.com/photo-1554995207-c18c203602cb|https://images.unsplash.com/photo-1560518883-ce09059eeffa|https://images.unsplash.com/photo-1518780664697-55e3ad937233|https://images.unsplash.com/photo-1524661135-423995f22d0b', '/images/maps/EdsDorm.png', 'available', '2026-05-27 21:04:09', 'WiFi, Study Area, Security'),
(43, 18, 'Estacio\'s Boarding House', 'boarding house', 5000.00, 'No. 2B, 2 Basa St, West Tapinac, Olongapo City, 2200 Zambales', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267|https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf|https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', '/images/maps/EstacioBHouse.png', 'available', '2026-05-27 21:04:09', 'WiFi, Kitchen, CCTV'),
(44, 19, 'Francis Transient House Olongapo', 'boarding house', 6000.00, 'Labrador St, Olongapo City, 2200 Zambales', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa|https://images.unsplash.com/photo-1512917774080-9991f1c4c750|https://images.unsplash.com/photo-1493809842364-78817add7ffb|https://images.unsplash.com/photo-1554995207-c18c203602cb', '/images/maps/Francis.png', 'available', '2026-05-27 21:04:09', 'Aircon, TV, Kitchen'),
(45, 20, 'BF LODGING HOUSE/DORMITORY', 'dorm', 4500.00, '7 Fendler Ext., Olongapo City, Zambales', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af|https://images.unsplash.com/photo-1524661135-423995f22d0b|https://images.unsplash.com/photo-1518780664697-55e3ad937233', '/images/maps/BF Dorm.png', 'available', '2026-05-27 21:04:09', 'WiFi, Security, Water');

-- --------------------------------------------------------

--
-- Table structure for table `rentings`
--

CREATE TABLE `rentings` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `property_name` varchar(150) NOT NULL,
  `monthly_rate` decimal(10,2) NOT NULL,
  `lease_term` int(11) NOT NULL COMMENT 'Duration in months',
  `months_pending` int(11) DEFAULT 0,
  `pending_payment` decimal(10,2) DEFAULT 0.00,
  `total_paid` decimal(10,2) DEFAULT 0.00,
  `total_due` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `role` enum('tenant','occupant') DEFAULT 'tenant',
  `start_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `unit_occupancy` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rentings`
--

INSERT INTO `rentings` (`id`, `property_id`, `tenant_id`, `property_name`, `monthly_rate`, `lease_term`, `months_pending`, `pending_payment`, `total_paid`, `total_due`, `status`, `role`, `start_date`, `created_at`, `unit_occupancy`) VALUES
(102, 41, 1, 'Rizza\'s Bedspace', 3500.00, 6, -1, 0.00, 21000.00, 21000.00, 'Advanced payment', 'tenant', '2026-02-27', '2026-05-27 21:04:09', 'Bed A'),
(103, 41, 17, 'Rizza\'s Bedspace', 3500.00, 6, 5, 17500.00, 3500.00, 21000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Bed B'),
(104, 42, 16, 'Ed\'s Dormitory', 4000.00, 6, 5, 20000.00, 4000.00, 24000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Room 101'),
(105, 42, 18, 'Ed\'s Dormitory', 4000.00, 6, 5, 20000.00, 4000.00, 24000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Room 102'),
(106, 43, 19, 'Estacio\'s Boarding House', 5000.00, 6, 5, 25000.00, 5000.00, 30000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Room A'),
(107, 43, 20, 'Estacio\'s Boarding House', 5000.00, 6, 5, 25000.00, 5000.00, 30000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Room B'),
(108, 44, 1, 'Francis Transient House Olongapo', 6000.00, 6, 5, 30000.00, 6000.00, 36000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Transient 1'),
(109, 44, 17, 'Francis Transient House Olongapo', 6000.00, 6, 5, 30000.00, 6000.00, 36000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Transient 2'),
(110, 45, 16, 'BF LODGING HOUSE/DORMITORY', 4500.00, 6, 5, 22500.00, 4500.00, 27000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Dorm 1'),
(111, 45, 18, 'BF LODGING HOUSE/DORMITORY', 4500.00, 6, 5, 22500.00, 4500.00, 27000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 21:04:09', 'Dorm 2'),
(124, 40, 17, 'Buena Vista Homes', 8000.00, 6, 5, 40000.00, 8000.00, 48000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 23:16:09', 'Unit E'),
(125, 41, 1, 'Rizza\'s Bedspace', 3500.00, 6, 5, 17500.00, 3500.00, 21000.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 23:18:03', 'Bed 101');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `renting_id` int(11) NOT NULL,
  `property_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_type` varchar(50) DEFAULT 'Rent Payment',
  `payment_method` varchar(50) DEFAULT 'Wallet',
  `status` varchar(20) DEFAULT 'Success',
  `reference_number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `owner_id` int(11) DEFAULT NULL,
  `months_paid` int(11) NOT NULL DEFAULT 0,
  `unit_occupancy` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `tenant_id`, `renting_id`, `property_id`, `amount`, `transaction_type`, `payment_method`, `status`, `reference_number`, `created_at`, `owner_id`, `months_paid`, `unit_occupancy`) VALUES
(108, 17, 103, 41, 3500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-D4E5F6G7', '2026-05-27 21:04:09', 16, 1, 'Bed B'),
(109, 16, 104, 42, 4000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-E5F6G7H8', '2026-05-27 21:04:09', 17, 1, 'Room 101'),
(110, 18, 105, 42, 4000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-F6G7H8I9', '2026-05-27 21:04:09', 17, 1, 'Room 102'),
(111, 19, 106, 43, 5000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-G7H8I9J0', '2026-05-27 21:04:09', 18, 1, 'Room A'),
(112, 20, 107, 43, 5000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-H8I9J0K1', '2026-05-27 21:04:09', 18, 1, 'Room B'),
(113, 1, 108, 44, 6000.00, 'Rent Payment', 'Gcash', 'Success', 'PAY-I9J0K1L2', '2026-05-27 21:04:09', 19, 1, 'Transient 1'),
(114, 17, 109, 44, 6000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-J0K1L2M3', '2026-05-27 21:04:09', 19, 1, 'Transient 2'),
(115, 16, 110, 45, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-K1L2M3N4', '2026-05-27 21:04:09', 20, 1, 'Dorm 1'),
(116, 18, 111, 45, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-L2M3N4O5', '2026-05-27 21:04:09', 20, 1, 'Dorm 2'),
(123, 1, 102, 41, 3500.00, 'Rent Payment', 'payMaya', 'Pending', 'PAY-F58D69C9', '2026-05-13 21:51:31', 16, 1, 'Bed A'),
(124, 1, 102, 41, 3500.00, 'Rent Payment', 'gCash', 'Pending', 'PAY-453BF4CF', '2026-05-26 21:51:37', 16, 1, 'Bed A'),
(125, 1, 102, 41, 7000.00, 'Rent Payment', 'gCash', 'Pending', 'PAY-F4820403', '2026-05-19 21:55:01', 16, 2, 'Bed A'),
(126, 1, 102, 41, 3500.00, 'Rent Payment', 'gCash', 'Up to date', 'PAY-A171580F', '2026-05-27 21:55:43', 16, 1, 'Bed A'),
(127, 1, 102, 41, 3500.00, 'Rent Payment', 'gCash', 'Advanced payment', 'PAY-443F06C3', '2026-05-27 21:56:10', 16, 1, 'Bed A');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `phone_iv` varchar(255) DEFAULT NULL,
  `phone_tag` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `address_iv` varchar(255) DEFAULT NULL,
  `address_tag` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `balance` decimal(15,2) DEFAULT 0.00,
  `profile_picture` text DEFAULT NULL,
  `payment_methods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Stores gCash, payMaya, etc. as JSON' CHECK (json_valid(`payment_methods`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `full_name`, `email`, `phone_number`, `phone_iv`, `phone_tag`, `date_of_birth`, `address`, `address_iv`, `address_tag`, `country`, `gender`, `password`, `created_at`, `balance`, `profile_picture`, `payment_methods`) VALUES
(1, 'Eryhn', 'Eryhn Jann Amarille', '202311107@gordoncollege.edu.ph', 'AqYxV9KgNMzNlQ==', 'EGgZPdmjgTF85swE', 'H3Xm/NKxqseF/XtunxOlUg==', '2003-11-12', 'AlRq8n1lEFFALD83yLE0UzdDIp0KbFGNZK5FXuU2Fuyl', '41VilhEJggljT8B+', 'VkjYxJ1knedjpBQoLpx94A==', 'Netherlands', 'Male', '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-04-30 12:59:47', 607232.00, '/images/profilePics/prof_pics.png', '{\"gCash\":true,\"payMaya\":true,\"bankTransfer\":false,\"cash\":false}'),
(16, 'alex_j', 'Alexa Johnson', 'alex16@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-27 20:56:37', 153500.00, '/images/profilePics/1.jpg', '{\"gCash\":true,\"payMaya\":true,\"bankTransfer\":false,\"cash\":false}'),
(17, 'maria_c', 'Ed Batumbakal', 'maria17@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-27 20:56:37', 142000.00, '/images/profilePics/2.jfif', '{\"gCash\":true,\"payMaya\":true,\"bankTransfer\":false,\"cash\":false}'),
(18, 'john_s', 'John Smith', 'john18@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-27 20:56:37', 150000.00, '/images/profilePics/3.jfif', '{\"gCash\":true,\"payMaya\":true,\"bankTransfer\":false,\"cash\":false}'),
(19, 'emma_w', 'Brandon Batumbakal', 'emma19@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-27 20:56:37', 150000.00, '/images/profilePics/4.jfif', '{\"gCash\":true,\"payMaya\":true,\"bankTransfer\":false,\"cash\":false}'),
(20, 'david_l', 'David Lee', 'david20@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-27 20:56:37', 142000.00, '/images/profilePics/5.jfif', '{\"gCash\":true,\"payMaya\":true,\"bankTransfer\":false,\"cash\":false}');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `fk_tenant_balance` (`tenant_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `rentings`
--
ALTER TABLE `rentings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_number` (`reference_number`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `fk_transaction_property` (`property_id`),
  ADD KEY `transactions_ibfk_2` (`renting_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `rentings`
--
ALTER TABLE `rentings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=130;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD CONSTRAINT `fk_tenant_balance` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inquiries_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inquiries_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rentings`
--
ALTER TABLE `rentings`
  ADD CONSTRAINT `rentings_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rentings_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transaction_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`renting_id`) REFERENCES `rentings` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
